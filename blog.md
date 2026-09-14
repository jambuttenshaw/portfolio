---
layout: base.njk
title: Blog
---

<h1>My Blog</h1>

<p>A place for me to share miscellaneous unrelated writings.</p>

{% set table %}{% include "blog-table.njk" %}{% endset %}
{{ table | safe }}
