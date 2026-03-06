---
layout: base.njk
title: Home
---

<h1>Welcome to My Portfolio</h1>

<p>Hello! I'm a developer passionate about creating amazing web experiences.</p>

<h2>About Me</h2>

<p>I'm a full-stack developer with experience in modern web technologies.</p>

<h2>Featured Projects</h2>

{% set table %}{% include "projects-table.njk" %}{% endset %}
{{ table | safe }}

<p><a href="/projects/">View All Projects</a></p>

<h2>Contact</h2>

<ul>
<li><strong>Email:</strong> your.email@example.com</li>
<li><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/yourprofile">Your LinkedIn Profile</a></li>
<li><strong>GitHub:</strong> <a href="https://github.com/yourusername">Your GitHub Profile</a></li>
<li><strong>Twitter:</strong> <a href="https://twitter.com/yourhandle">@yourhandle</a></li>
</ul>
