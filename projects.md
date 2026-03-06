---
layout: base.njk
title: Projects
---

<h1>My Projects</h1>

<p>Here are some of the projects I've worked on. Each project has its own detailed page with more information.</p>

{% set table %}{% include "projects-table.njk" %}{% endset %}
{{ table | safe }}