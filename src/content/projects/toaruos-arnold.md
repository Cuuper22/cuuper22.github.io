---
title: "ToaruOS-Arnold + ArnoldC-Native"
slug: "toaruos-arnold"
emoji: "🎭"
tier: "highlight"
tech: ["ArnoldC", "x86 Assembly", "Scala", "C"]
repo: "https://github.com/Cuuper22/ToaruOS-Arnold"
oneLiner: "22,000 lines of bare-metal x86. Every keyword is an Arnold Schwarzenegger quote."
---

ToaruOS-Arnold is 22,000 lines of bare-metal x86. a full desktop operating system with a GUI, networking, filesystem, and games. Every single keyword is an Arnold Schwarzenegger quote. `GET TO THE CHOPPER` is a function call. `I'LL BE BACK` is a loop. `HASTA LA VISTA BABY` terminates a process. It boots from a 213KB binary and runs Snake.

I built it because I wanted to know what a computer *actually does* when you tell it to draw a pixel. Not what React does. Not what the browser does. What the CPU does. Register by register. The only way to know for real.

Problem was, ArnoldC only compiled to JVM bytecode. You can't run a JVM on bare metal. that's not how any of this works. So I had to write a real compiler for a joke language. ArnoldC-Native adds native x86 codegen, kernel-mode packages, and 40 new keywords for systems programming. Written in Scala. `EVERYBODY CHILL` disables interrupts. `I NEED YOUR CLOTHES YOUR BOOTS AND YOUR MEMORY` is malloc. It makes more sense than it should.

It's simultaneously the dumbest and most technically serious project I've made. Nicholas Carlini from Google DeepMind saw it and reached out. That was a good day.

**Repos:** [ToaruOS-Arnold](https://github.com/Cuuper22/ToaruOS-Arnold) · [ArnoldC-Native](https://github.com/Cuuper22/ArnoldC-Native)

## Screenshots

![Boot splash](/screenshots/toaruos/01-boot-splash.png)

![Desktop environment](/screenshots/toaruos/03-desktop.png)

![Terminal with neofetch](/screenshots/toaruos/04-terminal-neofetch.png)

![Snake game windowed](/screenshots/toaruos/06-snake-windowed.png)

![Start menu](/screenshots/toaruos/12-start-menu.png)
