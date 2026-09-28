---
title: "ArnoldC-Native"
slug: "arnoldc-native"
icon: "chip"
file: "ARNOLDC.JAR"
tier: "headline"
order: 2
tech: ["Scala", "Parboiled PEG", "NASM x86", "Freestanding C"]
repo: "https://github.com/Cuuper22/ArnoldC-Native"
oneLiner: "A compiler for a language made of Arnold quotes, rebuilt to emit bare-metal x86 so the joke could boot."
updated: "2026-05-09"
demo: "arnoldc"
---

ArnoldC is an esoteric language where every keyword is an Arnold Schwarzenegger quote. The original compiler targets the JVM, which is fine until you want to write an operating system in it. ArnoldC-Native is my Scala fork that adds three new backends: freestanding C (`-native`), NASM x86 assembly (`-asm`), and kernel packages (`-kernel`).

To write a kernel you need things the original language never had: sized integers, pointers, structs, unions, arrays, bitwise operations, port I/O, interrupt control, and an escape hatch into raw assembly. So a new Parboiled PEG grammar adds about 90 keywords on top of the original 33, and every one of them had to be a quote. `I NEED YOUR MEMORY` is malloc. `YOU'RE LUGGAGE` is free. `EVERYBODY CHILL` disables interrupts and `LET'S PARTY` turns them back on. `SPEAK TO THE MACHINE` opens an inline assembly block. It makes more sense than it should.

The part that took real engineering is the assembly backend. `AsmGenerator` emits cdecl-style stack frames with parameters at `[ebp+8+4i]`, lays out locals and arrays per method, keeps break and continue label stacks, and scales array indexing by element type. That output is what [ToaruOS-Arnold](/?open=toaruos-arnold) is built from: `THIS IS A WARRIOR` appears 1,406 times in the kernel, `LET ME TELL YOU SOMETHING` 395 times.

The panel above is a toy: a few lines of JavaScript that mimic the shape of the real codegen for the handful of keywords shown, so you can see what the compiler is doing without installing sbt. The real thing is 5,400 lines of Scala, about 980 of them in the x86 generator alone.
