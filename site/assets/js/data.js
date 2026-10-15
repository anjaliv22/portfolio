/*
  All portfolio content lives here. Both pages (the garden and Pro mode) read from this file,
  so edit it once and both stay in sync.

  Optional art: when you have watercolour images, put them in assets/img/ and set the `art`
  paths below. Anything left as null is drawn in code instead.
*/
window.PORTFOLIO = {
  person: {
    name: 'Anjali Vathanakumaran',
    tagline: 'I teach cameras to see. Here is my garden.',
    role: 'Computer Engineering student, Mechatronics Option',
    school: 'University of Waterloo',
    classOf: 2028,
    email: 'avathana@uwaterloo.ca',
    github: 'https://github.com/anjaliv22',
    linkedin: 'https://www.linkedin.com/in/anjvatha',
    resumeUrl: '', // e.g. 'assets/Anjali-Resume.pdf' (leave out your phone number before uploading)
    funFact: '',   // optional single line on the garden's model card
    // Fun facts: cards in Pro mode, and a list on the garden's model card.
    // icon options: dance | belt | abacus | yarn | book | star
    funFacts: [
      { icon: 'dance', title: 'Classical dancer and teacher', text: "I've been learning South Indian classical dance since I was three, and now I teach it too." },
      { icon: 'belt', title: 'Black belt in taekwondo', text: 'I trained my way up to a black belt in taekwondo.' },
      { icon: 'abacus', title: 'UCMAS baccalaureate', text: 'I completed UCMAS abacus mental math all the way to the baccalaureate level.' },
      { icon: 'yarn', title: 'Always crocheting', text: "I love to crochet, and right now I'm on a binge of making all kinds of stuffed animals." },
      { icon: 'book', title: 'Bookworm', text: 'I love to read. My unbeatable favourite is A Thousand Splendid Suns.' },
    ],
    specialties: ['Embedded systems', 'Computer vision', 'Machine learning', 'Full-stack software'],
    coursework: ['Embedded Microprocessor Systems', 'Digital Hardware Systems', 'Real-Time Operating Systems', 'Computer Networks', 'Systems Programming and Concurrency'],
    skills: {
      Languages: ['C', 'C++', 'Python', 'SystemVerilog', 'VHDL', 'RISC-V Assembly', 'Java', 'JavaScript', 'C#/.NET', 'MATLAB'],
      'Hardware & protocols': ['STM32', 'ESP32', 'AMD KV260', 'Altera FPGA', 'UART', 'SPI', 'I2C', 'CAN', 'USB', 'PWM'],
      'ML & vision': ['PyTorch', 'TensorFlow', 'YOLO', 'TensorRT', 'ONNX'],
      'Web & tools': ['React', 'Node.js', 'Django', 'GraphQL', 'KiCad', 'Altium', 'Vivado', 'Git'],
    },
  },

  experience: [ // oldest first; Pro mode shows newest first
    {
      id: 'graze',
      bullets: [ // straight from the resume; shown in Pro mode
        "Built and scaled production-grade web scraping automation systems in Python, engineering robust data pipelines that extracted millions of data points and reduced data sourcing costs by over $10k annually.",
        "Architected and iteratively benchmarked multiple scraping pipelines using Django, Selenium and Scrapy, selecting optimal approaches to reduce runtime by 60% and improve reliability through automated data enrichment.",
      ],
      org: 'Graze AI',
      role: 'Software Engineering Intern',
      dates: 'May – August 2024',
      year: '2024',
      location: 'Toronto, Ontario',
      prop: 'laptop',
      headline: 'Turning the messy web into clean data.',
      intro: 'My first internship. I built the scrapers that fed Graze AI\'s data, then made them faster, cheaper and more reliable.',
      stats: [
        { value: 'Millions', label: 'of data points extracted' },
        { value: '$10k+', label: 'saved on data sourcing each year' },
        { value: '60%', label: 'faster pipeline runtime' },
      ],
      contributions: [
        { title: 'Scrapers at scale', body: 'Built and scaled production web-scraping automation in Python, with data pipelines that extracted millions of data points and cut data sourcing costs by over $10k a year.' },
        { title: 'Benchmarked pipelines', body: 'Built and compared scraping pipelines in Django, Selenium and Scrapy, then picked the best approach to cut runtime by 60% and improve reliability with automated data enrichment.' },
      ],
      tools: ['Python', 'Django', 'Selenium', 'Scrapy'],
    },
    {
      id: 'honest',
      bullets: [ // straight from the resume; shown in Pro mode
        "Designed and implemented scalable backend services using Node.js, building dynamic data synchronization pipelines between cloud services and implementing schema-flexible GraphQL queries to support various client data models.",
        "Developed internal tooling dashboards using HTML/CSS and server-rendered templates, automating client configuration workflows and reducing manual operational overhead.",
      ],
      org: 'The Honest Consultants',
      role: 'Software Developer Intern',
      dates: 'January – April 2025',
      year: '2025',
      location: 'Toronto, Ontario',
      prop: 'clipboard',
      headline: 'Backends that keep client data in sync.',
      intro: 'I built backend services and internal tools that took repetitive work off the team\'s plate.',
      stats: [],
      contributions: [
        { title: 'Data sync pipelines', body: 'Designed and built scalable Node.js backend services that keep data in sync between cloud services.' },
        { title: 'Schema-flexible GraphQL', body: 'Wrote GraphQL queries flexible enough to support the different data models each client used.' },
        { title: 'Internal dashboards', body: 'Built tooling dashboards with HTML/CSS and server-rendered templates that automated client configuration and cut manual work.' },
      ],
      tools: ['Node.js', 'GraphQL', 'HTML/CSS'],
    },
    {
      id: 'martinrea1',
      bullets: [ // straight from the resume; shown in Pro mode
        "Re-architected and standardized a production-grade Python codebase for industrial ML-based computer vision systems into a multiprocessing architecture, adopted as the core codebase for CV deployments across manufacturing plants globally.",
        "Adapted the vision system for a conveyor belt production line, developing a ghost-box tracking algorithm to maintain part identity under variable camera frame rates, preventing duplicate or dropped detections that could stall production.",
        "Developed and trained a three-stage model pipeline (detection, classification and segmentation) using machine learning architectures to perform sequential quality checks on each part, reducing defect detection false negatives to 0.77%.",
      ],
      org: 'Martinrea International',
      role: 'Computer Vision Application Intern',
      dates: 'September – December 2025',
      year: '2025',
      location: 'Vaughan, Ontario',
      prop: 'magnifier',
      headline: 'Teaching factory cameras to catch defects.',
      intro: 'I rebuilt the computer vision codebase used on production lines and trained the models that check every part.',
      stats: [
        { value: '0.77%', label: 'defect false negatives' },
        { value: '3-stage', label: 'detect, classify, segment pipeline' },
        { value: 'Global', label: 'plants running the codebase' },
      ],
      contributions: [
        { title: 'Multiprocessing re-architecture', body: 'Re-architected and standardized a production Python codebase for industrial ML vision into a multiprocessing design, now the core codebase for CV deployments at plants worldwide.' },
        { title: 'Ghost-box tracking', body: 'Adapted the system for a conveyor line with a ghost-box tracking algorithm that keeps each part\'s identity at variable frame rates, so parts are never double-counted or dropped.' },
        { title: 'Three-stage model pipeline', body: 'Trained a detection, classification and segmentation pipeline for sequential quality checks, bringing defect false negatives down to 0.77%.' },
      ],
      tools: ['Python', 'Multiprocessing', 'Object tracking', 'Detection', 'Segmentation'],
    },
    {
      id: 'martinrea2',
      bullets: [ // straight from the resume; shown in Pro mode
        "Engineered a React/HTML-based front end and C++ backend to bring the standardized Python-based vision system into a live inspection application, integrating a Django-based data-offloading pipeline to sync edge-device results to a centralized server.",
        "Designed a human-in-the-loop vision system accommodating real-time inspection for 13 assemblies to reduce manual inspection time, selecting cameras and hardware while evaluating and integrating YOLO, TensorRT and ONNX models.",
      ],
      org: 'Martinrea International',
      role: 'Computer Vision Engineering Intern',
      dates: 'May – August 2026',
      year: '2026',
      location: 'Vaughan, Ontario',
      prop: 'camera',
      headline: 'Bringing the vision system onto the factory floor.',
      intro: 'I turned the standardized vision system into a live inspection app, and chose the cameras and hardware to run it.',
      stats: [
        { value: '13', label: 'assemblies inspected in real time' },
        { value: '3', label: 'model stacks evaluated: YOLO, TensorRT, ONNX' },
      ],
      contributions: [
        { title: 'Live inspection app', body: 'Engineered a React/HTML front end and C++ backend that bring the Python vision system into a live inspection application.' },
        { title: 'Edge-to-server pipeline', body: 'Integrated a Django data-offloading pipeline that syncs edge-device results to a central server.' },
        { title: 'Human-in-the-loop inspection', body: 'Designed a human-in-the-loop system for real-time inspection of 13 assemblies, selecting cameras and hardware and integrating YOLO, TensorRT and ONNX models.' },
      ],
      tools: ['React', 'C++', 'Django', 'YOLO', 'TensorRT', 'ONNX'],
    },
    {
      id: 'electrium',
      bullets: [ // straight from the resume; shown in Pro mode
        "Leading the development of a BLDC electronic speed controller (ESC), working on embedded motor control firmware involving state-machine-based control, PWM generation, sensor feedback and closed-loop control validation.",
      ],
      org: 'Electrium Mobility',
      role: 'Firmware Team Lead',
      dates: 'December 2025 – September 2026',
      year: '2026',
      location: 'Waterloo, Ontario',
      prop: 'wrench',
      headline: 'Firmware that makes an electric motor spin.',
      intro: 'I led the firmware team building a BLDC electronic speed controller (ESC), the brains that drive the motor.',
      stats: [],
      contributions: [
        { title: 'State-machine motor control', body: 'Led development of embedded motor-control firmware built around a state machine.' },
        { title: 'PWM and sensor feedback', body: 'Worked on PWM generation and sensor feedback for the BLDC motor.' },
        { title: 'Closed-loop validation', body: 'Validated the closed-loop control so the motor responds the way it should.' },
      ],
      tools: ['C', 'Embedded firmware', 'PWM', 'Closed-loop control'],
    },
  ],

  projects: [
    {
      id: 'rtx',
      name: 'Real-Time Executive Kernel',
      short: 'RTX Kernel',
      date: 'January 2026',
      kind: 'Hardware',
      color: 'coral',
      tagline: 'A tiny operating system for a microcontroller.',
      points: [
        'A multitasking kernel written in C for the STM32 (ARM Cortex-M4).',
        'Task scheduling APIs and TCB-based state management.',
        'Interrupt-driven context switching, so tasks run safely at the same time.',
      ],
      tools: ['C', 'STM32', 'ARM Cortex-M4', 'RTOS'],
      link: 'https://github.com/anjaliv22',
    },
    {
      id: 'wordle',
      name: 'Four-Letter Wordle',
      short: 'FPGA Wordle',
      date: 'January 2026',
      kind: 'Hardware',
      color: 'blush',
      tagline: 'Wordle, built out of logic.',
      points: [
        'A custom Wordle game in SystemVerilog on the AMD KV260 FPGA.',
        'Finite state machines and synthesizable control logic for input and state transitions.',
        'Drives the display output directly from hardware.',
      ],
      tools: ['SystemVerilog', 'AMD KV260', 'FSM design'],
      link: 'https://github.com/anjaliv22',
    },
    {
      id: 'cpusim',
      name: 'Multi-Core CPU Simulator',
      short: 'CPU Simulator',
      date: 'August 2025',
      kind: 'Software',
      color: 'magenta',
      tagline: 'A pretend multi-core computer, written in C++.',
      points: [
        'Simulates several cores scheduling and running tasks.',
        'Custom dynamic deques and memory management.',
        'Supports runtime resizing and performance-tuned workload execution.',
      ],
      tools: ['C++', 'Data structures', 'Memory management'],
      link: 'https://github.com/anjaliv22',
    },
    {
      id: 'water',
      name: 'Water Reservoir Monitoring System',
      short: 'Water Reservoir',
      date: 'May – August 2025',
      kind: 'Hardware',
      color: 'white',
      tagline: 'Smart irrigation on an STM32.',
      points: [
        'A potentiometer sets the PWM duty cycle for a DC-motor watering output, and a servo routes water to the chosen field.',
        'Distance sensors measure the water level.',
        'A custom timer board with dual 7-segment displays, checked on an oscilloscope, then turned into a custom PCB in Proteus.',
      ],
      tools: ['STM32', 'C++', 'PWM', 'Proteus PCB'],
      link: 'https://github.com/anjaliv22',
    },
    {
      id: 'fall',
      name: 'Fall Detection Classifier',
      short: 'Fall Detection',
      date: 'January – April 2025',
      kind: 'Software',
      color: 'lilac',
      tagline: 'Telling a fall apart from everyday movement.',
      points: [
        'Advanced a fall-detection device by building and testing classification models.',
        'Binary classifiers and TensorFlow CNNs trained on barometric pressure sensor data.',
        'Each event is classified as fall or no-fall.',
      ],
      tools: ['Python', 'TensorFlow', 'CNNs'],
      link: 'https://github.com/anjaliv22',
    },
  ],

  // Optional watercolour art. Paths are relative to index.html; sizes are in scene pixels (scene is 1440 x 900).
  art: {
    background: null, // a full 1440x900 garden painting replaces the code-drawn scene behind everything
    gardener: null,   // { src: 'assets/img/gardener.png', w: 150, h: 220 }  (feet at the bottom centre)
    bunnies: {},      // { graze: { src: 'assets/img/bunny-graze.png', w: 80, h: 90 }, ... }  (feet at the bottom centre)
    peonies: {},      // { rtx: { src: 'assets/img/peony-coral.png', w: 80, h: 80 }, ... }
  },
};
