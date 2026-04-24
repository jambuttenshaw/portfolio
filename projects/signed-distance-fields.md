---
layout: base.njk
title: GPU-Driven Signed Distance Field Construction
description: 
    An investigation of GPU-driven tree construction algorithms for Signed Distance Field geometry, as well as using procedural geometry in DirectX Raytracing pipelines for rendering.
github: https://github.com/jambuttenshaw/sdf_d3d12
hidden: false
image: /images/sdf.png
tags:
    - Cpp
    - D3D12
    - Raytracing
---

{% import "two-column-layout.njk" as layout %}

<!--
TODO:
- Add banner image.
- Add captions to images.
- Add data and comment on findings.
    - Collect data on 5090
- Fill in links
- Editing.
-->

# GPU-Driven Signed Distance Fields Construction

{% set tagslist %}{% include "tags.njk" %}{% endset %}
{{ tagslist | safe }}

![](/images/sdf_banner.png)

This project was developed over a period of 6 months to fulfill my honours degree at Abertay University. This page provides a blog-style description of the project, but you can also [read my full dissertation](/resources/Dissertation.pdf).

{% include "github-link.njk" %}

## Introduction
Signed distance fields (SDFs) are an implicit representation of geometry
with useful properties, e.g. constructive solid geometry. They are useful for sculpting tools, deformable objects, fluids, and volumetric effects. These techniques can be challenging to perform with polygons. 
Until recently, the use of SDFs in real-time interactive applications has been
limited due to performance and memory constraints. There has been lots of investigation into how SDFs can be rendered in real-time; however, the study of discrete SDFs that are also modifiable in real-time has not been investigated to the same depth.

This project implements a sparse representation of SDFs, which is constructed with a GPU-driven compute shader pipeline, and rendered using hardware-accelerated raytracing and software sphere-tracing. The top-down
construction algorithm hierarchically refines space and uses culling solutions to accelerate distance field evaluation.

Results found that rendering is scalable with the number of primitives, and demonstrates that efficiently culling primitive shapes is key for
construction performance, improving construction time by orders of magnitude.

In the rest of the page, I'm going to discuss:
- Background work that inspired me, what I took from it, and what I adapted.
- The GPU-driven construction pipeline I implemented.
- The crucial optimizations to enable real-time performance.
- Conclusions drawn from the project.

I mostly focus on my decision-making and outline the pipeline that I developed - for full technical details on how it works, [my dissertation is available to read](/resources/Dissertation.pdf)!

## Background

Signed distance fields come in two varieties - continuous and discrete. The work of [Inigo Quilez](https://iquilezles.org/articles/raymarchingdf/) is a superb example of continuous signed distance functions. In these examples, the entire scene is represented by a single distance function, which is evaluated at each step of each ray. While effective for graphics demos, this doesn't scale well; rendering time generally increases non-linearly with scene complexity, and it is for this reason that continuous SDFs are avoided for representing complex geometry in most real-time applications.

An alternative is to make the distance field discrete - evaluate the entire distance function for every point in space in advance and cache the result into a 3D grid. Then, when you come to render the distance field, costly distance function evaluations are replaced by texture lookups. This introduces a trade-off between the memory consumption of the distance field and the resolution (and therefore quality) of the rendered object. This approach is used in [*Claybook* by Second Order](https://claybookgame.com/).

There are many options for how to represent the grid data (e.g., sparse vs dense), and different data structures provide different ways to accelerate traversal during rendering. [Ray Tracing of Signed Distance Function Grids](https://jcgt.org/published/0011/03/06/paper-lowres.pdf) by So&#776;derlund, Evans, and Akenine-Mo&#776;ller was a significant inspiration for this project. While their main contribution was an analytical ray-SDF intersection method, they also perform a thorough comparison between different SDF representations and acceleration structures. They found that a sparse set of 'bricks' (cubes of distance values - in the paper 8x8x8 distance values were used) accompanied with a bounding volume hierarchy (BVH) for accelerating traversal provided a good trade-off between fast rendering and lower memory overhead.

For my project, I also needed a structure that could be constructed quickly. To animate the primitive signed distance functions within an object, I would need to rebuild the acceleration structure every frame. I decided to build on the sparse-brick-set approach described by So&#776;derlund et al (and similar to the geometry representation used in [*Dreams* by Media Molecule](https://www.playstation.com/en-gb/games/dreams/)) for the following reasons:
- 'Bricks' are at a coarser granularity than 'voxels' (where a voxel can be formed of 2x2x2 distance field samples), which will favour faster construction. This is less optimal for rendering performance, as an additional sphere-tracing step would be required in the intersection shader.
- To build the BVH, I could leverage DirectX Raytracing (DXR)'s API. This enables use of the raytracing hardware on modern GPUs for rendering.
- 64 distance samples per brick fits nicely within a compute shader group, allowing the leverage of group-shared memory and helping to keep the GPU nicely full of work.

## Implementation

My main contribution with this project is a fast and parallel method of constructing SDF geometry on the GPU, so most of this section will be spent describing the construction algorithm. The key building block of my SDF geometry is 'bricks' (terminology borrowed from *Dreams*), which is an AABB that encapsulates 8x8x8 distance values.
The pipeline for constructing SDF geometry in my project looks like this:

- **Create an 'edit' list.** This is the recipe of the object, consisting of a list of primitive shapes ('edits') and operations to combine them together (union, subtraction, etc).
- **Edit dependency analysis.** This is a pre-process step to enable edit culling by working out how edits affect one another.
- **Hierarchical brick construction.** A tree of bricks is created in an iterative process, quartering in size with each level to converge around the geometry surface. The number of iterations performed determines the resulting size of the bricks (and consequently the resolution of the geometry).
- **Edit culling.** This is the key optimization to enable real-time construction, by only evaluating the signed distance functions that will definitely influence the distance field values.
- **Distance field evaluation.** Once all of the bricks have been identified, they each need to be filled with distance field data. This distance field data is then later rendered using a combination of hardware-accelerated raytracing and software sphere-tracing.

Once SDF geometry is constructed, I make use of the hardware-accelerated DirectX Raytracing API to render it. The rendering pipeline looks like this:
{% call layout.twoColumnLayout("/images/raytracing.png", "Ray-tracing is used for rendering, with SDF geometry on left and the brick bounding boxes on the right.", true) %}

- **Build BVH.** A bounding-volume hierarchy is built around the leaf nodes of the brick tree before rendering begins.
- **Ray-Brick Intersection.** The hardware-accelerated raytracing API performs Ray-AABB intersection testing.
- **Sphere-tracing within bricks.** When a ray intersects a brick, sphere-tracing is used to move from the brick boundary to the contained surface.
- **Shading.** Once an intersection has been determined, shading can proceed as normal.

{% endcall %}

This two-level rendering process, using hardware-accelerated raytracing to find ray-AABB intersections followed by sphere-tracing to find intersections with the SDF surface, proved to be very scalable and support hundreds of thousands of bricks. 

This is demonstrated in the table and graph below, where the same object was constructed from 4,000-400,000 bricks. It can be seen that rendering latency does not significantly increase as the number of bricks increases (data collected on an NVIDIA 5090).


{% call layout.twoColumnLayout("/images/sdfRenderingPerformance.png", "Rendering performance for a number of different brick sizes (and consequently brick counts).", true) %}

Brick Count | Rendering Time (ms)
-|-
4,042|0.78
19,090|0.72
79,222|0.69
362,825|0.79

{% endcall %}

<!-- INSERT GRAPH OF RENDER TIME VS BRICK COUNT to demonstrate scalability -->


### Constructing Bricks

The first challenge to building SDF geometry is to decide where to evaluate the distance field. Clearly I cannot evaluate every point in space, especially not in real-time. Plus, the memory requirements to store distance values at all points would severely limit the region of space that geometry could exist in. This is evident in *[Claybook](https://claybookgame.com/)*, which used a dense distance field with a maximum resolution of 1024x512x1024 and consequently gameplay is constrained to a small region of space.

{% call layout.twoColumnLayout("/images/brickPool.png", "A slice from the brick pool, with magnified excerpt on the right. The boundaries of bricks can be identified clearly.") %}

A sparse representation of the distance field improves scalability. We place bricks in regions of space that contain any surface (i.e., a region of space which contains both positive and negative distance values), and each brick will point to some region of a 'brick atlas' (as shown to the left) which stores the distance values for the entire object in a compact manner. The challenge lies in determining where these regions of space that contain a surface lie. The method I went with was a hierarchical refinement of space to narrow-in on regions of space that contain a surface.

{% endcall %}

In this hierarchical process, if a brick contains a surface, it will split into 64 sub-bricks in the next iteration, with one-quarter the side length. This method is well suited for the GPU for a bunch of reasons:
- One compute shader group can operate on each brick, with one thread executing per candidate sub-brick. These threads can co-operate with loading edits into group-shared memory to reduce the VRAM bandwidth consumed.
- A prefix-sum is performed to calculate indices to place the sub-bricks. Only the sums of sub-bricks-per-brick need to scanned, which significantly reduces the amount of data to operate on. Scanning allows a compact buffer to be maintained, improving cache usage when loading bricks from VRAM in later stages.
- Sub-bricks are sorted by Morton codes calculated from their positions before inserting them into the buffer. This ensures that bricks nearby in space are located nearby in the buffer, which reduces cache thrashing due to incoherent data.
- A consequence of the hierarchical process is that sorting bricks within each group before placing them in the buffer is enough to guarantee that the entire buffer is sorted at the end of the construction process. You can understand this by considering how the most significant bits of the Morton codes do not change with proceeding iterations.
- D3D12's indirect execution model can be utilized for the GPU to feed itself work for each subsequent iteration. The total number of iterations can be calculated on the CPU ahead of time by deciding on an initial and minimum brick size.

![](/images/hierarchical.png)

Once all bricks are placed, we know exactly where to evaluate the distance field. Each brick contains 8x8x8 distance values, and each of these can be calculated by iterating through the edit list and evaluating each edit in turn at the current point in space. One compute shader group operates per brick, so the threads can co-operate in loading edits into group-shared memory to reduce memory bandwidth.

In the early iterations of hierarchical brick construction the GPU suffers from low occupancy due to the small workloads. Only after a few iterations are enough bricks spawned to keep the GPU fully fed. However, building the tree of bricks is blazingly fast compared to evaluating the distance field they encompass, so it was much more worthwhile to optimize the distance field evaluation. This was done by introducing *edit culling*...

### Edit Culling

The obvious optimization is to realize the collection of bricks only represent a subset of all 3D space. The consequence of this is that edits are local - they only affect the distance field to a certain point and not beyond (which is not the case with pure signed distance *functions*). Therefore, we can cull edits for bricks in which they will have no influence. However, determining an edits influence is not as trivial as you might think.

The introduction of 'smooth blending' operations, which is one of the most satisfying features of SDF geometry, means that the influence of edits extends beyond the geometric bounds of the primitive shape itself. Additionally, edits within the edit list will influence other edits that appear later in the list.

This requires an analysis of what I called 'edit dependencies'. This is the identification of which edits are influenced by preceding edits in the list, and ensure that an edit is only culled if all of its dependencies are also able to be culled.

With an understanding of the dependencies established, edit culling is refined iteratively throughout hierarchical brick construction. This is achieved by refining 'index buffers' for each brick, which maintains a list of only the relevant edits for each brick. This introduces a memory overhead to store these index buffers, but dramatically accelerates distance field evaluation - especially as scenes scale in number of bricks and/or edits.

![](/images/editCount.png)
<div class="image-caption">
Heatmap showing number of SDF evaluations with different amounts of smooth blending. It can be seen smooth blending dramatically increases the number of SDF overlaps, diminishing the effects of edit culling.
</div>

<!-- INSERT DATA COMPARING WITH / WITHOUT EDIT CULLING TO SHOW PERFORMANCE IMPROVEMENT -->

## Conclusions

This was my first project working with D3D12, and I definitely learned a lot.

If I were to develop this further, I would be interested in investigating the following:
- The current method uses a significantly amount of transient memory between stages. Implementing this pipeline with DirectX 12 Work Graphs would allow for much more efficient usage of transient memory.
- Supporting a dynamic level-of-detail (LOD) system would make this scale much better to larger scenes. Geometry further away from the viewpoint can use larger bricks, which reduces the computational load of evaluating the distance field at further distances, where a high-resolution distance field becomes less important.
- It would be very interesting to investigate a 'lazy evaluation' system - similar to the GPU-driven out-of-core rendering of [Gigavoxels](https://dl.acm.org/doi/10.1145/1507149.1507152) (Crassin et al, 2009).
- Most modern raytracing-enabled renderers use hybrid approach of rasterization for a first pass, followed by raytracing for indirect lighting and shadow calculation. To be able to integrate this project into a modern renderer, it would be useful to be able to rasterize the AABB's generated by the construction pipeline and sphere-trace within them, instead of only supporting raytracing. This is quite similar to how the rendering pipeline of *Dreams* works.

## Videos

Check out additional video content about this project:

## References
