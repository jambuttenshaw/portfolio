---
layout: blog-post.njk
title: My First Blog Post
description: An example post demonstrating the formatting and layout available for blog posts.
date: 2026-09-14
---

{% import "two-column-layout.njk" as layout %}

This is an example post showing off the formatting and layout available for blog posts. Once you're happy with the look, feel free to replace it with your own content.

## Headings and paragraphs

Use standard Markdown for headings (`#`, `##`, `###`) and body text. You can use *italics*, **bold**, and [links](https://en.wikipedia.org/wiki/Signed_distance_field) inline.

## Lists

Unordered lists:

- First item
- Second item, with a little more detail than the first
- Third item

Ordered lists:

1. Set up the scene
2. Build the acceleration structure
3. Render the frame

## Blockquotes

Blockquotes are useful for highlighting important points or quoting other work:

> The best way to learn graphics programming is to render something, break it, and figure out why it broke.

## Code

Inline code works with backticks: `float4 colour = albedo * saturate(dot(N, L));`

Fenced code blocks are available for longer snippets:

```hlsl
// A compute shader entry point (DirectX 12)
[numthreads(8, 8, 1)]
void mainCS(uint3 dispatchThreadId : SV_DispatchThreadID)
{
    // Compute the distance field value for this voxel
    float3 point = VoxelToWorld(dispatchThreadId);
    g_SDF[dispatchThreadId.x] = EvaluateEdits(point);
}
```

## Images

Full-width images can have a caption below them:

![](/images/raytracing.png)
<div class="image-caption">
A full-width image with a caption below it. (This is the existing raytracing.png image.)
</div>

And the two-column layout used on the project pages puts text alongside an image:

{% call layout.twoColumnLayout("/images/raytracing2.png", "An example caption for the two-column image layout. (This is the existing raytracing2.png image.)", true) %}

Text can sit alongside an image instead of stacking below it. The text column appears on the left by default, with the image on the right - pass `false` as the last argument to the `twoColumnLayout` macro to swap them.

{% endcall %}

## Tables

Markdown tables render too:

| Brick Count | Construction (ms) |
|-|-|
| 4,042 | 0.67 |
| 362,830 | 1.49 |
