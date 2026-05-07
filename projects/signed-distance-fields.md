---
layout: base.njk
title: GPU-Driven Signed Distance Field Construction
description: 
    An investigation of GPU-driven construction algorithms for Signed Distance Field geometry, using procedural geometry in DirectX Raytracing pipelines for rendering.
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
- Fill in links
- Add another image to background (on discrete vs continuous distance fields?)
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
with many useful properties, most notably of which is an affinity for [constructive solid geometry](https://en.wikipedia.org/wiki/Constructive_solid_geometry). They are useful for sculpting tools, deformable objects, fluids, and volumetric effects; techniques which can be challenging to perform with polygons. 
There has been a lot of investigation into how SDFs can be rendered efficiently in real-time, both directly and also via building a mesh out of the distance field (e.g, via [marching cubes](https://en.wikipedia.org/wiki/Marching_cubes)).
However, the study of discrete SDFs that are also modifiable in real-time has not been investigated to the same depth.

This project focuses on SDF construction. I implemented a sparse SDF representation that can be constructed with a GPU-driven compute shader pipeline and rendered using a combination of hardware-accelerated raytracing and software [sphere-tracing](https://graphics.stanford.edu/courses/cs348b-20-spring-content/uploads/hart.pdf). The top-down construction algorithm hierarchically refines space and uses culling solutions to accelerate distance field evaluation.

In the rest of the page, I'm going to discuss:
- Background work that inspired me, what I took from it and what I adapted.
- The GPU-driven construction pipeline I implemented.
- The crucial optimizations to enable real-time performance.
- Conclusions drawn from the project.

I mostly focus on my decision-making and outline the pipeline that I developed - for the full technical details and analysis, [my dissertation is available to read](/resources/Dissertation.pdf)!

## Background

{% call layout.twoColumnLayout("/images/inigoQuilez.png", "A scene created by Inigo Quilez entirely from continuous SDFs, which can be viewed on [ShaderToy](https://www.shadertoy.com/view/4ttSWf).", true) %}

Signed distance fields come in two varieties - continuous and discrete. The work of [Inigo Quilez](https://iquilezles.org/articles/raymarchingdf/) is a superb example of continuous signed distance functions. In this case, the entire scene is represented by a single distance function that is evaluated at each step of each ray. While used to great effect in graphics demos, this doesn't scale well; rendering time generally increases worse-than-linearly with scene complexity, and it is for this reason that continuous SDFs are avoided for representing complex geometry in most real-time applications.

{% endcall %}

An alternative is to make the distance field discrete - evaluate the entire distance function for every point in space in advance and cache the result into a 3D grid. Then, when it comes to rendering the distance field, costly distance function evaluations are replaced by texture lookups. This introduces a trade-off between the memory consumption of the distance field and the resolution (and therefore quality) of the rendered object. This approach is used in [*Claybook* by Second Order](https://claybookgame.com/).

There are many options for how to represent the grid data (e.g., sparse vs dense), and different data structures provide different ways to accelerate traversal during rendering. [Ray Tracing of Signed Distance Function Grids (2022)](https://jcgt.org/published/0011/03/06/paper-lowres.pdf) by So&#776;derlund, Evans, and Akenine-Mo&#776;ller was a significant inspiration for this project. While their main contribution was an analytical ray-SDF intersection method, they also perform a thorough comparison between different SDF representations and acceleration structures. They found that a sparse set of 'bricks' (small cubes of distance values) placed into a bounding volume hierarchy (BVH) for accelerating traversal provided a good trade-off between fast rendering and lower memory overhead.

{% call layout.twoColumnLayout("/images/dreamsBricks.png", "Visualization of Bricks in *Dreams*. Taken from Alex Evans' superb [Learning From Failure](https://advances.realtimerendering.com/s2015/AlexEvans_SIGGRAPH-2015-sml.pdf) presentation at SIGGRAPH 2015 - which inspired this project.", false) %}

For my project, I also needed a structure that could be constructed quickly. To animate the primitive signed distance functions within an object, I would need to rebuild the acceleration structure every frame. I decided to build on the sparse-brick-set approach described by So&#776;derlund et al (and similar to the geometry representation used in [*Dreams* by Media Molecule](https://www.playstation.com/en-gb/games/dreams/)) for the following reasons:

{% endcall %}

- The coarser granularity of 'Bricks' compared to individual voxels will favour faster construction as there are fewer elements to place into an acceleration structure. This is less optimal for rendering performance, as an additional sphere-tracing step would be required in the intersection shader.
- To build the BVH, I could leverage DirectX Raytracing (DXR)'s API. This enables use of the raytracing hardware on modern GPUs for rendering.
- 64 distance samples per brick fits nicely within a compute shader group, allowing the leverage of group-shared memory and helping to keep the GPU nicely full of work.

## Implementation

{% call layout.twoColumnLayout("/images/raytracing.png", "Hardware ray-tracing is used for rendering. The SDF geometry is shown on left and the surrounding bricks are on the right.", true) %}

My main contribution with this project is a fast and parallel method of constructing SDF geometry on the GPU. The key building block of my SDF geometry is 'bricks' (terminology borrowed from *Dreams*), which is an AABB that encapsulates 8x8x8 distance values.
The pipeline for constructing SDF geometry in my project looks like this:

{% endcall %}

- **Create an 'edit' list.** This is the recipe of the object, consisting of a list of primitive shapes ('edits') and operations to combine them together (union, subtraction, etc).
- **Edit dependency analysis.** This is a pre-process step to enable edit culling by creating a table that describes which edits affect one another.
- **Hierarchical brick construction.** A tree of bricks is created in an iterative process, quartering in size with each level to converge around the geometry surface. The wide-and-shallow tree is able to saturate the GPU with enough bricks to process in fewer iterations than, for example, an octree.
- **Edit culling.** This is the key optimization to enable real-time construction. Only the signed distance functions that will definitely influence the distance field values are evaluated.
- **Distance field evaluation.** Once all of the bricks have been identified, they each need to be filled with distance field data. This distance field data is then later rendered using a combination of hardware-accelerated raytracing and software sphere-tracing.

Once SDF geometry is constructed, I make use of the hardware-accelerated DirectX Raytracing API to render it. The rendering pipeline looks like this:

- **Build BVH.** A bounding-volume hierarchy is built around the leaf nodes of the brick tree before rendering begins.
- **Ray-Brick Intersection.** The hardware-accelerated raytracing API performs Ray-AABB intersection testing.
- **Sphere-tracing within bricks.** When a ray intersects a brick, sphere-tracing is used to move from the brick boundary to the contained surface.
- **Shading.** Once an intersection has been determined, shading can proceed as the geometry's material desires.

This two-level rendering process, using hardware-accelerated raytracing to find ray-AABB intersections followed by sphere-tracing to find intersections with the SDF surface, proved to be very scalable and support hundreds of thousands of bricks. Resolution was found to be the more important factor when it came to rendering latency, rather than scene complexity.

![](/images/sdfScene.png)
<div class="image-caption">
The test scene used to gather data. It's made up of 1024 primitive 'edits', with lots of smooth blending and overlapping edits.
</div>

The scene shown above was constructed with different brick sizes, resulting in 4,000 - 400,000 bricks, and rendered at 4K resolution without lighting to focus on measuring ray-surface intersections. It can be seen that rendering latency does not significantly increase as the number of bricks increases (data collected on an NVIDIA RTX 5090).

{% call layout.twoColumnLayout("/images/sdfRenderingPerformance.png", "Rendering performance for a number of different brick counts. Rendering time is not closely related to the number of bricks.", true) %}

Brick Count | Raytracing (ms)
-|-
4,042|0.78
19,090|0.72
79,222|0.69
362,825|0.79

{% endcall %}

### Constructing Bricks

*[Claybook](https://claybookgame.com/)*, which used a dense distance field, constrains gameplay to a defined region of space to bound memory consumption. I wanted to avoid this and to allow geometry to exist anywhere. However, clearly I cannot evaluate every point in space due to bounded space and time requirements.

{% call layout.twoColumnLayout("/images/brickPool.png", "A slice from the brick pool, with magnified excerpt on the right. The boundaries of bricks can be identified clearly.") %}

This can be handled with a sparse representation of the distance field. Bricks are only placed in regions of space that actually contain any surface. 

Each brick owns some region of a 'brick atlas' (as shown to the left), where all distance values for the entire object are stored in a compact manner. The challenge lies in determining the regions of space that contain a surface. The method I went with was a hierarchical refinement of space to narrow-in on regions of space that contain a surface over multiple iterations.

{% endcall %}

In this hierarchical process, if a brick contains a surface, it will split into 64 sub-bricks in the next iteration, with one-quarter the side length. This method is well suited for the GPU for a bunch of reasons:
- One compute shader group operates on each brick, with one thread executing per candidate sub-brick. These threads can co-operate with loading edits into group-shared memory to reduce bandwidth usage and improve coherency.
- A prefix-sum is performed to calculate indices to place the sub-bricks. Only the sums of sub-bricks-per-brick need to scanned, rather than the sub-bricks themselves, which significantly reduces the amount of data to operate on. Scanning allows a compact buffer to be maintained, improving cache coherence when loading bricks from VRAM in later stages.
- Sub-bricks are sorted by Morton codes calculated from their positions before inserting them into the buffer. This ensures that bricks nearby in space are located nearby in the buffer, which reduces cache thrashing due to incoherent data.
- Sorting bricks within each group before placing them in the buffer is enough to guarantee that the entire buffer is sorted at the end of the construction process. You can understand this by considering how later iterations will only affect lesser significant bits in the morton codes.
- D3D12's indirect execution model can be utilized for the GPU to feed itself work for each subsequent iteration. The total number of iterations can be calculated on the CPU ahead of time by deciding on an initial and minimum brick size. This avoids data round-trips back to the CPU.

![](/images/hierarchical.png)
<div class="image-caption">
3 iterations of brick-building. Bricks quarter in size with each iteration, and only bricks that contain some surface are subdivided.
</div>

Once all bricks are placed, we know exactly where to evaluate the distance field. Each brick contains 8x8x8 distance values, and each of these can be calculated by iterating through the edit list and evaluating each edit in turn at the current point in space. One compute shader group operates per brick, so the threads can co-operate in loading edits into group-shared memory to reduce the memory bandwidth consumed.

The table and graph below shows times for brick construction and SDF evaluation for the same scene as before, constructed at a variety of brick sizes. This scene is made up of 1024 edits, and data was collected on an NVIDIA RTX 5090.

{% call layout.twoColumnLayout("/images/sdfConstructionPerformance_noEditCulling.png", "Construction time as brick count increases. Construction time increases linearly with amount of geometry in the scene.", true) %}

Brick Count | Brick Building (ms) | SDF Evaluation (ms)
-|-|-
4,100|0.79|5.63
19,565|0.87|25.97
82,501|1.95|108.67
377,101|5.05|496.16

{% endcall %}

In the early iterations of hierarchical brick construction the GPU suffers from low throughput due to the small workloads, but this alleviates after ~2 iterations. However, SDF evaluation was a huge bottleneck, especially on a scene with lots of overlapping edits. Small number of bricks could be evaluated in real-time, but construction time quickly exploded. To tackle this, I introduced *edit culling*...

### Edit Culling

The obvious optimization is to realize the collection of bricks only represent a subset of all 3D space. The consequence of this is that edits are local - they only affect the distance field to a certain point and not beyond (which is not the case with pure signed distance *functions*). Therefore, we can cull edits for bricks in which they will have no influence. However, determining an edits influence is not as trivial as you might think.

The introduction of 'smooth blending' operations, which is one of the most satisfying features of SDF geometry, means that the influence of edits extends beyond the geometric bounds of the primitive shape itself. Additionally, edits within the edit list will influence other edits that appear later in the list.

This requires an analysis of 'edit dependencies'. This is the identification of which edits are influenced by preceding edits in the list, and ensure that an edit is only culled if all of its dependencies are also able to be culled. Smooth blending dramatically increases the number of dependencies between edits, reducing the effectiveness of edit culling.

![](/images/editCount.png)
<div class="image-caption">
Heatmap showing number of edits evaluated per voxel with low (left) and high (right) amounts of smooth blending. It can be seen smooth blending dramatically increases the number of SDF overlaps, diminishing the effects of edit culling.
</div>

With an understanding of the dependencies established, edit culling is refined iteratively throughout hierarchical brick construction. This is achieved by refining 'index buffers' for each brick, which maintains a list of only the relevant edits for each brick. This introduces a memory overhead to store these index buffers, but dramatically accelerates distance field evaluation - especially as scenes scale in number of bricks and/or edits.

{% call layout.twoColumnLayout("/images/sdfConstructionPerformance_editCulling.png", "Construction time as brick count increases, with edit culling enabled. Construction still time increases linearly, but is orders of magnitude faster.", true) %}

Brick Count | Brick Building (ms) | SDF Evaluation (ms) | Speedup
-|-|-|-
4,042|0.67|0.27|5.8x
19,087|0.63|0.94|16.1x
79,250|0.94|3.45|24.2x
362,830|1.49|13.69|32.0x

{% endcall %}

With edit culling enabled, the reduction in both brick building time and SDF evaluation is stark; orders of magnitude faster. It is particularly effective in this scene, with a very large number of edits.

## Conclusions

This was my first project working with D3D12, and I definitely learned a lot. Some of my personal highlights were:
- Building a GPU-driven pipeline, using indirect execution and multiple stages of compute shaders. I became very familiar with the SIMT programming model for the GPU and understanding how to leverage group-shared memory and collaboration between threads to accelerate parallel algorithms.
- Working with DirectX Raytracing and custom intersection shaders to make procedural geometry.
- Significant time spent debugging with Microsoft PIX and learning to use all of the tools available there.
- In-depth analysis of occupancy, cache hits, SM throughput, and many others in NVIDIA NSight, and other data to inform pipeline optimizations.

If I were to develop this further, I would be interested in investigating the following:
- The current method uses a significantly amount of transient memory between stages. Implementing this pipeline with DirectX 12 Work Graphs would allow for much more efficient usage of transient memory.
- Supporting a dynamic level-of-detail (LOD) system would make this scale much better to larger scenes. Geometry further away from the viewpoint can use larger bricks, which reduces the computational load of evaluating the distance field at further distances, where a high-resolution distance field becomes less important.
- It would be very interesting to investigate a ray-guided evaluation system - similar to the GPU-driven out-of-core rendering of [Gigavoxels (Crassin et al, 2009)](https://dl.acm.org/doi/10.1145/1507149.1507152).
- Most modern raytracing-enabled renderers use hybrid approach of rasterization for a first pass, followed by raytracing for indirect lighting and shadow calculation. To be able to integrate this project into a modern renderer, it would be useful to be able to rasterize the AABB's generated by the construction pipeline and sphere-trace within them, instead of only supporting raytracing. This is quite similar to how the rendering pipeline of *Dreams* works.

## Videos

<div style="text-align: center; max-width: 100%;">
<iframe style="max-width: 100%; width: 560px; height: 315px;" src="https://www.youtube.com/embed/VDC3vSBE-bk?si=vU4Q2uK1TUJ2l_Qv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<div style="text-align: center; max-width: 100%;">
<iframe style="max-width: 100%; width: 560px; height: 315px;" src="https://www.youtube.com/embed/Y6qnGLtWf10?si=ky5dLlUyM_ICXBat" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<div style="text-align: center; max-width: 100%;">
<iframe style="max-width: 100%; width: 560px; height: 315px;" src="https://www.youtube.com/embed/y6Reo1VShN4?si=devMG3fKIigO5Aq5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>
