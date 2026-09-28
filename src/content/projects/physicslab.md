---
title: "PhysicsLab"
slug: "physicslab"
icon: "phone"
file: "PHYSLAB.APK"
tier: "supporting"
order: 1
tech: ["Kotlin", "Jetpack Compose", "DSP", "BLE", "Hilt"]
repo: "https://github.com/Cuuper22/PhysicsLab"
oneLiner: "Your phone as a real physics instrument. 35 experiments, 9 sensors, FFT and filters written from scratch."
updated: "2026-09-09"
---

PhysicsLab treats a phone like a real physics instrument instead of a bag of disconnected sensor demos: 35 experiments across 6 categories, driven by 9 kinds of sensor (accelerometer, gyroscope, magnetometer, light, pressure, proximity, microphone, GPS, and Bluetooth LE). Kotlin, Jetpack Compose, Material 3. Inspired by phyphox from RWTH Aachen, reimplemented from scratch.

The part worth inspecting is the engineering split. Sensors are not glued directly to screens. Capture, signal processing, graphing, persistence and export, and remote control are separate modules. The DSP does real work: an FFT that allocates nothing after setup and runs on precomputed sin/cos tables, Butterworth biquad filters, autocorrelation, peak detection. The graphing is a custom Compose Canvas engine running at 60fps, because off-the-shelf chart libraries choke on live sensor streams. That's the difference between a demo and a platform, and 329 tests keep it honest.

It exports CSV, TSV, and Excel (the old binary format, written by hand, no Apache POI), runs an embedded web server so any browser on the network can drive an experiment, talks to phyphox-compatible hardware over BLE, and loads phyphox XML experiment definitions. Doppler effect, sonar, pendulum periods, elevator height from air pressure: the physics you would set up on a lab bench, except the bench is already in everyone's pocket.

![Doppler effect experiment](https://raw.githubusercontent.com/Cuuper22/PhysicsLab/HEAD/demo/verified/QA_T17_doppler.png)
