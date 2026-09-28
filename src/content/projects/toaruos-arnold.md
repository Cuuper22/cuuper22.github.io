---
title: "ToaruOS-Arnold"
slug: "toaruos-arnold"
icon: "shades"
file: "TOARUOS.EXE"
tier: "headline"
order: 1
tech: ["ArnoldC", "x86 Assembly", "NASM", "Multiboot", "E1000"]
repos:
  - { label: "ToaruOS-Arnold", url: "https://github.com/Cuuper22/ToaruOS-Arnold" }
  - { label: "ArnoldC-Native", url: "https://github.com/Cuuper22/ArnoldC-Native" }
oneLiner: "A windowed x86 desktop OS with its own TCP/IP stack. Every keyword is an Arnold Schwarzenegger quote."
updated: "2026-09-09"
demo: "toaru"
---

ToaruOS-Arnold is about 22,000 lines of ArnoldC plus 3,400 lines of hand-written assembly: a 32-bit desktop operating system with a window manager, a terminal, five playable games, a virtual filesystem, and a TCP/IP stack that can `wget` a real web page over an emulated Intel E1000. Every keyword in the source is an Arnold Schwarzenegger quote. `LISTEN TO ME VERY CAREFULLY` declares a function. `STICK AROUND` is a loop. `HASTA LA VISTA, BABY` is on the shutdown screen. The whole thing boots from a 212,576-byte binary, and the window above is that binary, running in your browser.

I built it because I wanted to know what a computer *actually does* when you tell it to draw a pixel. Not what React does. Not what the browser does. What the CPU does. Register by register. The only way to know for real.

Problem was, ArnoldC only compiled to JVM bytecode, and you can't run a JVM on bare metal. So I had to write a real compiler for a joke language. That's [ArnoldC-Native](/?open=arnoldc-native), and it's the other half of this project.

The language fights you the whole way. There is no early return. There are no negative numbers. Expressions evaluate strictly left to right, so `a*b+c*d` means `((a*b)+c)*d`. The worst bug I hit was a single `mov dx, 0x3F8` for serial debug output that clobbered the half of `edx` holding the TCP header size. The first `fillRect` called `putPixel` once per pixel, 786,000 calls for a full screen, before it became a native `rep stosd` with dirty-rectangle redraw.

It's simultaneously the dumbest and most technically serious project I've made. Nicholas Carlini from Google DeepMind saw it and reached out. That was a good day.

## Running it here

The emulator is [v86](https://github.com/copy/v86), an x86 PC compiled to WebAssembly. Getting the stock kernel to boot in it took three small patches to the image, all loader-level, none to the OS itself: a flat GDT (v86's multiboot loader never loads one), the framebuffer address (v86 maps it at `0xE0000000`, QEMU at `0xFD000000`), and a PS/2 mouse resync. Networking is off because v86 doesn't emulate an E1000. Everything else is the real thing.

## Screenshots

![The ToaruOS-Arnold desktop](/screenshots/toaruos/03-desktop.png)

![Terminal running neofetch](/screenshots/toaruos/04-terminal-neofetch.png)

![Snake in a floating window](/screenshots/toaruos/06-snake-windowed.png)

![The start menu](/screenshots/toaruos/12-start-menu.png)
