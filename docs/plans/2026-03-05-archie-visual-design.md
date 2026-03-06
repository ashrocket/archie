# Archie Visual Design: Illustrated Storybook RPG

Date: 2026-03-05

## Core Concept

The page IS the overworld. Archie is a hand-drawn character who lives in a book that behaves like a game. The user is reading a living page — ink illustrations, warm color washes, handwritten marginalia — but the illustrations move, the character walks, you can talk to him, and he gives you things.

**One-liner:** A picture book that plays like an RPG.

## Character Design: Archie

- Hand-drawn, chunky ink lines, rough-edged, charming because it's imperfect
- 2-3 head proportion (not chibi, not realistic — storybook character)
- Slightly oversized round glasses (the Velma/Velmo DNA — cerebral, searching, owlish)
- A coat he lives in — oversized, rumpled, professorial but not polished
- Warm autumn palette: burnt orange, deep teal, warm brown, cream
- Masculine with some softness — broad shoulders but gentle posture
- Expressive through posture and glasses-adjusting more than facial detail

### Idle Animations
- Walking through scenes, pausing to examine things
- Adjusting glasses (thinking)
- Scribbling in a notebook
- A bird landing on his head unnoticed while he's deep in thought
- Glancing up at the "camera" (at the user) every few seconds

### Personality in Visual Details
- Architecture diagrams being used as a coaster
- A stack of books that's also a chair
- Marginalia that comments on the conversation
- Humor that's warm, observational, never punching down

## The World: Living Page Aesthetic

### _why the lucky stiff DNA
- Hand-drawn characters interrupting content
- Humor in the margins
- Art that's rough on purpose — not polished, not precious
- The feeling that someone made this for you at 2 AM
- Chunky illustrations with warm color washes

### Harry Potter Living Page DNA
- The page is alive — ink moves, portraits respond, maps reveal themselves
- The medium itself is magical, not just the content displayed on it
- Content that watches you back
- Handwritten annotations that appear and shift

### Visual Layers
- **Background:** Hand-drawn pastoral scenes — forest clearings, paths, streams
- **Midground:** Trees, rocks, environmental details with subtle parallax
- **Character layer:** Archie walking, sitting, thinking, reacting
- **Foreground/UI:** Marginalia, doodles, annotations that frame the scene
- **Overlay:** Interactive elements — paper airplanes, floating poems, item notifications

### Color Palette
- Primary: warm browns, amber, cream (coffee shop meets library)
- Accent: deep teal, burnt orange
- Ink: rich dark brown/sepia (not pure black)
- Washes: muted watercolor tones — sage green, dusty blue, warm gold
- Overall feeling: autumn afternoon light

## Interaction Model: RPG in a Book

### Chat as Dialogue Box
- EarthBound-style dialogue box rises from bottom of viewport
- Text crawls character by character with soft tick-tick-tick
- Archie's portrait in left margin shifts expressions (thinking, eureka, concerned)
- Bitmap/handwritten font — not system fonts
- Code blocks render like scratched-on graph paper

### Responses as RPG Items
- Responses aren't just text — they're objects Archie gives you
- Item-get notification: "You received: Archie's Analysis"
- Conversation history styled as RPG inventory — grid layout, icons, categories
- A code review is a scroll. A refactor is a crystal. A bug fix is a potion.
- Items can be favorited, revisited, collected

### Response Delivery Moments
- **Paper airplane:** Drifts in from off-screen, Archie catches it, unfolds it, text appears
- **Floating poem:** Lines materialize one by one, hanging in the air beside Archie
- **Marginalia:** Response appears as handwritten notes in the page margins
- **Standard:** Dialogue box with text crawl for normal exchanges

### The Waiting State (Immersive Mode)
- When waiting for Claude to respond, scene expands toward full-screen
- Archie walks deeper into the scene — sits on a log, pulls out notebook
- Environmental animation intensifies — fireflies, wind in trees, stream rippling
- The world breathes while thinking happens
- Transition back is gentle — scene contracts as response arrives

## Emotional Register

- **Safe place to be confused** — the EarthBound quality
- **Warm, earnest, never ironic** — sincerity as a feature
- **Humor that never punches down** — observational, self-aware, delightful
- **The NPC who notices you're there** — Archie waits for you, acknowledges you
- **Handmade with care** — everything feels crafted, not generated

## Technical Architecture (High Level)

### Rendering: Hybrid CSS + Canvas
- CSS parallax layers for the world (hand-drawn background PNGs/WebP with transparency)
- Canvas overlay for character animation, interactive elements, particle effects
- DOM layer for dialogue box, inventory UI, text content
- Scene engine at the core — visual experience is the primary system, chat is a layer inside it

### Asset Pipeline
- Illustrations authored in Procreate / Clip Studio Paint
- Background layers exported as WebP with transparency
- Character sprites as PNG sprite sheets with JSON frame metadata
- Scene manifests (JSON) defining layer order, parallax depth, animation triggers
- Handwritten fonts as web fonts

### Scene Engine Requirements
- Scene management (load, transition, expand/contract for immersive mode)
- Parallax depth system for background layers
- Sprite animation system for character
- Interactive element system (draggable objects, clickable items)
- State machine for Archie's behavior (idle, walking, thinking, responding, receiving)
- Response delivery system (multiple modes: dialogue box, paper airplane, poem, marginalia)
- Transition system for compact ↔ immersive mode

## What This Is NOT
- Not a game — there are no goals, no progression, no fail states
- Not pixel art — hand-drawn ink and color wash, not grid-aligned
- Not polished/corporate — deliberately rough, handmade, personal
- Not ironic retro — earnestly recreating warmth, not winking at nostalgia
- Not decoration — the visual experience IS the product differentiator
