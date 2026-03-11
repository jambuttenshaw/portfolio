---
layout: base.njk
title: GPU-Driven SDF Construction
description: An investigation of GPU-driven tree construction algorithms for Signed Distance Field geometry, as well as using procedural geometry in DirectX Raytracing pipelines for rendering.
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

## Background

Signed distance fields come in two varieties - continuous and discrete. Continuous signed distance functions are what you would have seen in places like [Shadertoy](LINK). The entire scene is represented by a single distance function, which is evaluated at each step of each ray. This quickly becomes challenging; rendering time scales very poorly with scene complexity, and it is for this reason that continuous SDFs are avoided for representing complex geometry in most real-time applications.

An alternative is to make the distance field discrete - evaluate the entire distance function for every point in space and cache the result into a 3D grid. Then, when you come to render the distance field, evaluating costly distance functions is replaced by lookups from memory. This introduces a trade-off between the memory consumption of the distance field and the resolution (and therefore quality) of the rendered distance field. 

There are many options for how to represent the grid data (e.g., sparse vs dense), and different data structures provide different ways to accelerate traversal during rendering. [Ray Tracing of Signed Distance Function Grids](https://jcgt.org/published/0011/03/06/paper-lowres.pdf) by So&#776;derlund, Evans, and Akenine-Mo&#776;ller was a significant inspiration for this project. While their main contribution was an analytical ray-SDF intersection method, they also perform a thorough comparison between different SDF representations and acceleration structures. They found that a sparse set of 'bricks' (chunks of distance values - in the paper 8x8x8 collections of distance values were used) accompanied with a bounding volume hierarchy (BVH) for accelerating traversal provided a good trade-off between fast rendering and lower memory overhead.

For my project, I also needed a structure that could be constructed quickly. To animate the primitive signed distance functions within an object, I would need to rebuild the acceleration structure every frame. I decided to move forward with a sparse-brick-set approach for the following reasons:
- 'Bricks' are at a coarser granularity than voxels, so I reckoned constructing bricks would be faster than individual voxels.
- To build the BVH, I could leverage DirectX Raytracing (DXR)'s API. This enables use of the raytracing hardware on modern GPUs for rendering.
- With bricks being coarser, and having 64 distance samples per brick, this presents opportunities to leverage group-shared memory for groups of GPU threads to collaborate on a single brick.

## Implementation

-- The pipeline --

My main contribution with this project is a fast and parallel way to construct this set of bricks and evaluate the distance values they contain, so most of this section will be spent describing the construction algorithm.

### Constructing Bricks

I implemented a hierarchical process to iteratively refine bricks toward the surface of the object.

### Edit Culling

### Raytracing

Now that the acceleration structure and brick data has been constructed, rendering can be performed. I implemented this using a custom intersection shader in the raytracing pipeline.

The intersection shader will determine where the ray entered the bounding box of the brick. This gives the bounds along which to sphere-trace through the brick data.

## Results & Conclusions



## Videos

Check out additional video content about this project:

## References
