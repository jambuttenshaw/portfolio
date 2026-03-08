---
layout: base.njk
title: Home
---

# About Me

<section class="about-grid">
  <div class="about-image">
    <img src="images/me.png" alt="Jamie Buttenshaw profile photo">
  </div>
  <div class="about-text">
    I'm a research fellow in computer graphics and game engine technology for Virtual Production at the CoSTAR National Lab, based at Abertay University in Dundee.

    I am a C++ developer with expertise in modern graphics APIs and GPU programming, and experience working with and extending game engines including Unreal Engine 5.
  </div>
</section>

## Projects

{% set table %}{% include "projects-table.njk" %}{% endset %}
{{ table | safe }}

[View All Projects](projects.md)

## Experience

<div class="experience-box">

### Research Fellow
**CoSTAR National Lab**<br>
*July 2024 - Present*

As a Research Fellow as part of the CoSTAR National Lab, I work at the cutting edge of real-time graphics to develop graphics, VFX, and engine tools for the future of Virtual Production and immersive experiences.

</div>

<div class="experience-box">

### Research & Teaching Assistant
**Abertay University**<br>
*June 2023 - December 2023*

As a research assistant I developed a multiplayer XR sanbox for Meta Quest Pro using Unreal Engine 5 and C++. This involved plugin development, as well as native OpenXR and cross-platform multiplayer development.

As a teaching assistant I helped teach graphics programming with shaders in Direct3D 11 to 3rd year students, explaining foundational graphics pipeline and GPU programming knowledge.

</div>

## Education

<div class="experience-box">

### BSc(Hons) Computer Games Technology
**Abertay University**<br>
*2020-2024*

I specialised in graphics and engine programming, working directly with low-level graphics APIs to build performant systems, with a personal interest in advancing my C++ knowledge to use modern concepts to create elegant, modular, and maintanable code.

For excellence in my studies, I have been awarded:
- **TIGA Graduate of the Year** - Programming (2024)
- **Rebellion North Award for Engineering** (2024)
- **Honourary Fellows Prize for Innovation** (2024)
- **Alexander D G Kydd Prize** for general excellence (2022)
- **A D D McKay Senior Prize** for excellence in maths (2022)
- **David Potter Memoiral Prize** for general excellence (2021)
- **Hannah Maclure Prize** for excellence in maths (2021)

</div>

## Contact

- **Email:** jamie.buttenshaw@gmail.com
- **LinkedIn:** [Jamie Buttenshaw](https://www.linkedin.com/in/jamiebuttenshaw/)
- **GitHub:** [jambuttenshaw](https://github.com/jambuttenshaw)
