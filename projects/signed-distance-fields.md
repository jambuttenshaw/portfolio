---
layout: base.njk
title: GPU-Driven SDF Construction
description: Real-time Rendering and Construction of Signed Distance Fields, using GPU driven compute pipelines and DirectX Raytracing.
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

This was my honours project in my final year at Abertay University, developed over a period of 6 months.

[View the source code on GitHub]({{ github }})

## Introduction

Signed distance fields (SDFs) are an implicit representation of geometry. They are a scalar field of the distance to the nearest surface at each point in space, and inside vs outside of the surface is denoted by the sign of the distance value (e.g., inside is negative). SDFs can be easily rendered using a technique called [sphere tracing](LINK-TO-A-SHADERTOY).

The cool thing about SDFs is they can be used for [constructive solid geometry](LINK) (CSG), which allows various elementary operations between primitive shapes to create more complex and interesting geometry. For this reason, SDFs were famously used as the geometry representation in [Dreams by Media Molecule](LINK), as well as [Claybook by Second Order](LINK).

However, animating SDF geometry is a challenge. Dreams circumvents this by not allowing the individual primitve shapes ('edits') that constite each model to change over time. This is a limitation I wanted to investiage and attempt to overcome in this project.

## Background

Signed distance fields come in two varieties - continuous and discreet. Continuous signed distance functions are what you would have seen in places like [Shadertoy](LINK). The entire scene is represented by a single distance function, which is evaluated at each step of each ray. This quickly becomes challenging; rendering time scales very poorly with scene complexity, and it is for this reason that continuous SDFs are avoided for representing complex geometry in most real-time applications.

An alternative is to discretize the distance field - evaluate the entire distance function for every point in space and cache the result into a 3D grid. Then, when you come to render the distance field, evaluating costly distance functions is replaced by lookups from memory. This introduces a trade-off between resolution of the geometry and memory consumption of the distance field. There are many options for how to represent the grid data (e.g., sparse vs dense), and different data structures provide different ways to accelerate traversal.

[Ray Tracing of Signed Distance Function Grids](https://jcgt.org/published/0011/03/06/paper-lowres.pdf) by So&#776;derlund, Evans, and Akenine-Mo&#776;ller was a significant inspiration for this project. While their main contribution was an analytical ray-SDF intersection method, they also perform a thorough comparison between different SDF representations and acceleration structures. They found that a sparse set of 'bricks' (chunks of distance values - in the paper 8x8x8 collections of distance values were used) which were inserted into a BVH raytracing acceleration structure provided a good tradeoff between fast traversal for rendering and lower memory overhead.

## Implementation

My main contribution with this project is a fast and parallel way to construct this set of bricks and evaluate the distance values they contain, so most of this section will be spent describing the construction algorithm.

My project follows a similar approach to Dreams where models are represented as a collection of 'edits', which are composed together with CSG operations. The construction process takes this collection of edits and their associated operations and turns them into a collection of bricks and their contained distance values. 

These bricks are constructed only where required, i.e., only in regions of space that contain part of the surface. This leaves us with a sparse set of bricks that completely cover the surface of the model, and each brick is associated with a small region of discrete distance values.

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
