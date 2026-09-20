---
layout: base.njk
title: Blog
---

# My Blog

A place for me to share miscellaneous writings, on both professional and personal topics.

{% set table %}{% include "blog-table.njk" %}{% endset %}
{{ table | safe }}
