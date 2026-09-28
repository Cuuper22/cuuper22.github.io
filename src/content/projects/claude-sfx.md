---
title: "claude-sfx"
slug: "claude-sfx"
icon: "speaker"
file: "CLAUDSFX.WAV"
tier: "brief"
order: 2
tech: ["Python", "Audio synthesis"]
repo: "https://github.com/Cuuper22/claude-sfx"
oneLiner: "Sound effects for the terminal. Every sound synthesized from math.sin(). Zero dependencies."
updated: "2026-05-09"
---

Sound effects for the terminal. Every sound is synthesized from scratch with `math.sin()`, `struct.pack()`, and `wave.open()`. Zero dependencies. The FAAH (the error sound) is a descending sawtooth from 520Hz to 140Hz with increasing vibrato and soft clipping. The ding is bell harmonics at A5 with an inharmonic 4.2x overtone; that overtone is what makes it a bell instead of an organ pipe.

If you turned the sound on down in the tray, you've already heard both. This site's UI sounds are the same recipes, ported to WebAudio.

Terminals are too quiet. That's the whole thesis.
