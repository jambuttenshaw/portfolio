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

# Real-time Rendering and Construction of Signed Distance Fields

{% set tagslist %}{% include "tags.njk" %}{% endset %}
{{ tagslist | safe }}

This was my honours project in my final year at Abertay University, developed over a period of 6 months. This page provides a blog-style description of the project, but you can also [read my full dissertation](/resources/Dissertation.pdf).

{% include "github-link.njk" %}

## Introduction

Signed distance fields (SDFs) are an implicit representation of geometry. They are a scalar field of the distance to the nearest surface at each point in space, and inside vs outside of the surface is denoted by the sign of the distance value (e.g., inside is negative). SDFs can be easily rendered using a technique called [sphere tracing](LINK-TO-A-SHADERTOY).

The cool thing about SDFs is they can be used for [constructive solid geometry](LINK) (CSG), which allows various elementary operations between primitive shapes to create more complex and interesting geometry. For this reason, SDFs were notably used as the geometry representation in [*Dreams* by Media Molecule](LINK), as well as [*Claybook* by Second Order](LINK).

However, animating SDF geometry is a challenge. *Dreams* circumvents this by not allowing the individual primitive shapes (known as 'edits') that constitute each model to change over time. This is a limitation I wanted to investigate and attempt to overcome in this project.

In the rest of the page, I'm going to discuss:
- Existing background work that inspired me, what I took from it and what I adapted.
- The final implementation I went with in my project.
- The results of testing my implementation.
- Conclusions and opportunities for future work.

## Background

Signed distance fields come in two varieties - continuous and discrete. Continuous signed distance functions are what you would have seen in places like [Shadertoy](LINK). The entire scene is represented by a single distance function, which is evaluated at each step of each ray. This quickly becomes challenging; rendering time scales very poorly with scene complexity, and it is for this reason that continuous SDFs are avoided for representing complex geometry in most real-time applications.

An alternative is to make the distance field discrete - evaluate the entire distance function for every point in space and cache the result into a 3D grid. Then, when you come to render the distance field, evaluating costly distance functions is replaced by lookups from memory. This introduces a trade-off between the memory consumption of the distance field and the resolution (and therefore quality) of the rendered distance field. 

There are many options for how to represent the grid data (e.g., sparse vs dense), and different data structures provide different ways to accelerate traversal during rendering. [Ray Tracing of Signed Distance Function Grids](https://jcgt.org/published/0011/03/06/paper-lowres.pdf) by So&#776;derlund, Evans, and Akenine-Mo&#776;ller was a significant inspiration for this project. While their main contribution was an analytical ray-SDF intersection method, they also perform a thorough comparison between different SDF representations and acceleration structures. They found that a sparse set of 'bricks' (chunks of distance values - in the paper 8x8x8 collections of distance values were used) accompanied with a bounding volume hierarchy (BVH) for accelerating traversal provided a good trade-off between fast rendering and lower memory overhead.

For my project, I also needed a structure that could be constructed quickly. To animate the primitive signed distance functions within an object, I would need to rebuild the acceleration structure every frame. I decided to move forward with a sparse-brick-set approach for the following reasons:
- 'Bricks' are at a coarser granularity than voxels, so I reckoned constructing bricks would be faster than individual voxels.
- To build the BVH, I could leverage DirectX Raytracing (DXR)'s API. This enables use of the raytracing hardware on modern GPUs for rendering.
- With bricks being coarser, and having 64 distance samples per brick, this presents opportunities to leverage group-shared memory for groups of GPU threads to collaborate on a single brick.

## Implementation

My main contribution with this project is a fast and parallel way to construct SDF geometry, so most of this section will be spent describing the construction algorithm. The key building block of my SDF geometry is 'bricks' (more terminology borrowed from *Dreams*), which is an AABB that encapsulates 8x8x8 distance values.
The pipeline for constructing SDF geometry in my project looks like this:

- **Create an edit list.** This is the 'recipe' of the object if you like, consisting of a list of primitive shapes and operations to combine them together (union, subtraction, etc).
- **Edit dependency analysis.** This is a pre-process step to enable edit culling - discussed below.
- **Hierarchical brick construction.** Bricks are created in an iterative process, quartering in size with each iteration to converge around the geometry surface.
- **Edit culling.** This is the key optimization to enable real-time construction.
- **Distance field evaluation.** Once all of the bricks have been identified, they each need to be filled with distance field data. This distance field data is then later rendered using sphere-tracing.

### Constructing Bricks

The first challenge to building SDF geometry is to decide where to evaluate the distance field. Clearly I cannot evaluate every point in space, especially not in real-time. 

### Edit Culling

With the hierarchical brick construction method, evaluating the distance field within each brick is significantly the bottleneck of the construction pipeline. The obvious optimization is to realize that now we are only representing a subset of all 3D space within the bricks, edits are local - they only affect the distance field to a certain point and not beyond. Therefore, we can cull edits for bricks in which they will have no influence. However, determining an edits influence is not as trivial as you might think.

The introduction of 'smooth blending' operations, which is one of the most satisfying features of SDF geometry, means that the influence of edits extends beyond the geometric bounds of the primitive shape itself. Additionally, edits within the edit list will influence other edits that appear later in the list.

This requires an analysis of what I called 'edit dependencies'. This is the identification of which edits are influenced by preceding edits in the list, and ensure that an edit is only culled if all of its dependencies are also able to be culled.

With an understanding of the dependencies established as a pre-pass to construction (because the edit list does not change throughout construction), edit culling is refined iteratively throughout hierarchical brick construction. This is achieved by refining 'index buffers' for each brick, which maintains a list of only the relevant edits for each brick. This introduces a memory overhead to store these index buffers, but dramatically accelerates distance field evaluation - especially as scenes scale in number of bricks and/or edits.

### Raytracing

Now that the acceleration structure and brick data has been constructed, rendering can be performed. I implemented this using a custom intersection shader in the raytracing pipeline.

The intersection shader will determine where the ray entered the bounding box of the brick. This gives the bounds along which to sphere-trace through the brick data.

## Results & Conclusions

If I were to develop this further, I would be interested in investigating the following:
- The current method uses a significantly amount of transient memory between stages. Implementing this pipeline with DirectX 12 Work Graphs would allow for much more efficient usage of transient memory.
- It would be very interesting to investigate a 'lazy evaluation' system - similar to the GPU-driven out-of-core rendering of [Gigavoxels](https://dl.acm.org/doi/10.1145/1507149.1507152) (Crassin et al, 2009).

## Videos

Check out additional video content about this project:

## References
