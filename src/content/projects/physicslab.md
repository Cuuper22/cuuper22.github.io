---
title: "PhysicsLab"
slug: "physicslab"
emoji: "⚛️"
tier: "supporting"
tech: ["Kotlin", "Jetpack Compose", "DSP", "Material 3"]
repo: "https://github.com/Cuuper22/PhysicsLab"
oneLiner: "Your phone as a real physics instrument. 35 experiments, custom 60fps graphing, actual DSP."
---

PhysicsLab treats a phone like a real physics instrument instead of a bag of disconnected sensor demos. 35 experiments across 6 categories, driven by 9 sensor inputs. accelerometer, magnetometer, gyroscope, microphone, barometer, light, proximity, GPS, and Bluetooth LE. Kotlin, Jetpack Compose, Material 3. Inspired by phyphox from RWTH Aachen, reimplemented from scratch.

The part worth inspecting is the engineering split. Sensors are not glued directly to screens. The app has separate modules for sensor capture, signal processing, graphing, persistence and export, and remote control. The DSP pipeline does real work: FFT, autocorrelation, digital filters, peak detection. The graphing is a custom Compose Canvas engine running at 60fps because the off-the-shelf chart libraries choke on live sensor streams. That is the difference between a demo and a platform.

It also exports to CSV, TSV, and Excel, runs an embedded web server so you can drive an experiment from any browser on the same network, talks to Arduino over BLE, and loads phyphox-format XML experiment definitions. Doppler effect, sonar, pendulum periods, elastic collisions, elevator height from pressure. the physics you would set up on a lab bench, except the bench is already in everyone's pocket.
