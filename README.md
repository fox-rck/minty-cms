## An Exploration of Structuring a Node Application That Might Turn Into Something

That's what minty is. The short explanation is that that I've been obsessed with a simple question for the last year and some:

 > How do you effectively structure a Node application?

The operative word here is **effectively**. I've read many posts, seen quite a few examples, but none of them _felt right_.

This is my attempt to lean on my experience as a developer to see what I can do with Node and NPM.

## A Small Start

I've been fascinated with the [Ghost project](http://github.com/tryghost/ghost) and have pushed my blog to their platform. I thought it would be fun to work on the project - to help and learn things at the same time but
unfortunately Ghost is written like a PHP application - global settings, plugins, etc and what I wanted to do didn't align with where they wanted to go.

## A Tiny CMS Engine

That's what minty-cms is. It uses SQLite, creates versions, allows tagging etc. This is not a standalone app - it's meant to
plug in to a larger one (like an Express app).

That's coming next.

## Installation

Use NPM : `npm install robconery/minty-cms`

To run the tests,