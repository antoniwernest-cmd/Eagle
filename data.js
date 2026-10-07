/* All counts and names below are fictional classroom examples, not survey results. */
window.MAZE_WAZE_DATA = {
  source: "Fictional student votes for a school fun-day maze",
  excite: {
    label: "Excite", grade: 2,
    title: "Which maze path did Grade 2 choose?",
    subtitle: "For a pretend school fun day, 18 Grade 2 students each voted once for the maze path they would like to try first. Each path card shows one student's vote.",
    categories: ["Garden", "Bridge", "Tunnel", "Loop"],
    counts: [6, 4, 3, 5], scale: 1, symbol: "◆",
    routeCards: ["Bridge","Garden","Loop","Tunnel","Garden","Loop","Bridge","Garden","Tunnel","Loop","Garden","Bridge","Loop","Garden","Tunnel","Bridge","Loop","Garden"],
    numberQuestions: [
      {hundreds:0,tens:4,ones:2,choices:[24,32,42,52,420]},
      {hundreds:0,tens:7,ones:6,choices:[67,76,86,706,716]},
      {hundreds:1,tens:3,ones:2,choices:[123,132,142,230,312]}
    ],
    combineQuestion: {a:{hundreds:0,tens:2,ones:4},b:{hundreds:0,tens:1,ones:3},choices:[27,34,37,47,73]},
    additionLines: [
      {start:47,add:26,choices:[63,74,73,83,72]},
      {start:68,add:17,choices:[86,75,95,85,84]}
    ],
    venn: [
      {name:"Striped round compass sign", round:true, striped:true},
      {name:"Striped round wheel sign", round:true, striped:true},
      {name:"Plain round sun sign", round:true, striped:false},
      {name:"Plain round moon sign", round:true, striped:false},
      {name:"Striped rectangular flag", round:false, striped:true},
      {name:"Striped square arrow sign", round:false, striped:true},
      {name:"Plain arrow sign", round:false, striped:false},
      {name:"Plain square sign", round:false, striped:false}
    ],
    expectations: [
      ["D1.1", "Sort by two attributes with a Venn diagram."],
      ["D1.3", "Display data one-to-one in a pictograph or bar graph with a source, title, and labels."],
      ["D1.4", "Identify the mode and explain what it means."],
      ["D1.5", "Ask and answer questions about graphs and use them to draw a conclusion."],
      ["B1.1", "Read, represent, compose, and decompose whole numbers to 200 with place-value blocks."],
      ["B2.4", "Use objects, diagrams, and equations for addition situations with totals no greater than 100."]
    ]
  },
  inspire: {
    label: "Inspire", grade: 3,
    title: "Which maze path did Grade 3 choose?",
    subtitle: "For a pretend school fun day, 28 Grade 3 students each voted once for the maze path they would like to try first. Each path card shows one student's vote.",
    signTree: [
      {shape:"Round",colour:"Blue",symbol:"Star"},
      {shape:"Square",colour:"Yellow",symbol:"Arrow"},
      {shape:"Round",colour:"Yellow",symbol:"Arrow"},
      {shape:"Square",colour:"Blue",symbol:"Star"},
      {shape:"Round",colour:"Blue",symbol:"Arrow"},
      {shape:"Square",colour:"Yellow",symbol:"Star"},
      {shape:"Round",colour:"Yellow",symbol:"Star"},
      {shape:"Square",colour:"Blue",symbol:"Arrow"}
    ],
    categories: ["Garden", "Bridge", "Tunnel", "Loop"],
    counts: [6, 8, 4, 10], scale: 2, symbol: "◆",
    routeCards: ["Loop","Bridge","Garden","Tunnel","Garden","Loop","Bridge","Loop","Bridge","Tunnel","Garden","Loop","Loop","Bridge","Garden","Tunnel","Bridge","Loop","Garden","Loop","Tunnel","Bridge","Loop","Garden","Loop","Bridge","Loop","Bridge"],
    numberQuestions: [
      {hundreds:2,tens:3,ones:6,choices:[203,236,263,326,630]},
      {hundreds:4,tens:0,ones:5,choices:[45,405,450,504,540]},
      {hundreds:6,tens:7,ones:3,choices:[637,673,703,763,970]}
    ],
    combineQuestion: {a:{hundreds:1,tens:3,ones:2},b:{hundreds:0,tens:4,ones:6},choices:[168,172,178,184,268]},
    additionLines: [
      {start:113,add:38,choices:[150,151,141,152,161]},
      {start:246,add:57,choices:[293,304,313,302,303]}
    ],
    practiceRuns: [4, 6, 6, 8],
    foodDrive: {
      four: [{name:"Ava",cans:2},{name:"Ben",cans:4},{name:"Cara",cans:6},{name:"Dev",cans:8}],
      five: [{name:"Eva",cans:3},{name:"Finn",cans:4},{name:"Gia",cans:6},{name:"Hugo",cans:7},{name:"Ivy",cans:10}]
    },
    venn: [
      {name:"Glowing striped round badge", round:true, striped:true, glow:true},
      {name:"Striped round badge", round:true, striped:true, glow:false},
      {name:"Glowing round sun sign", round:true, striped:false, glow:true},
      {name:"Plain round moon sign", round:true, striped:false, glow:false},
      {name:"Glowing striped flag", round:false, striped:true, glow:true},
      {name:"Striped flag", round:false, striped:true, glow:false},
      {name:"Glowing square tile", round:false, striped:false, glow:true},
      {name:"Plain square tile", round:false, striped:false, glow:false}
    ],
    preview: {
      stems: {"1":"2 4 5 8", "2":"1 3 5 7"},
      values: [12,14,15,18,21,23,25,27],
      morning: [4,8,6,2], afternoon: [6,4,2,8], scale: 2
    },
    expectations: [
      ["D1.1", "Sort maze-sign designs by two attributes in a Venn diagram and by three attributes in a tree diagram."],
      ["D1.2 (part)", "Organize supplied path-choice data in a frequency table. Collecting data and organizing quantitative data are not assessed here."],
      ["D1.3", "Display data many-to-one in pictographs and bar graphs with sources, titles, labels, and suitable scales."],
      ["D1.4", "Find the mean and mode of whole-number data and explain them."],
      ["D1.5", "Analyse frequency tables and graphs with different scales and draw conclusions."],
      ["B1.1", "Read, represent, compose, and decompose whole numbers to 1000 with place-value blocks."],
      ["B2.5 (part)", "Use tools to represent and solve addition to 1000; algorithm work is not assessed here."]
    ]
  }
};
