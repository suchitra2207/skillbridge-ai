'use strict';

/**
 * skillRecommendations.js — deterministic, role-aware skill recommendations.
 *
 * Each entry maps a canonical skill name to:
 *   - priority:   'high' | 'medium' | 'low'  (assigned at runtime based on required vs preferred)
 *   - why:        Why this skill matters for the role (contextualised by role type)
 *   - activity:   A concrete, free learning activity (no external URLs invented)
 *   - project:    A practical exercise to build evidence
 *   - category:   skill category for display
 *
 * priority is NOT stored here — it is assigned by the gap analyser based on
 * whether the skill is in requiredSkills (high) or preferredSkills (medium/low).
 *
 * No external course links are generated. Descriptions reference well-known
 * free resources by name only (MDN, freeCodeCamp, official docs).
 */

const SKILL_RECS = {
  // ── Frontend ──────────────────────────────────────────────────────────────
  'HTML': {
    why:      'HTML is the structural foundation of every web page. Without it, you cannot build or modify any web interface.',
    activity: 'Work through the MDN HTML basics guide, building a personal profile page from scratch.',
    project:  'Build a fully semantic HTML page for a fictional restaurant menu — no CSS or JavaScript, structure only.',
    category: 'technical',
  },
  'CSS': {
    why:      'CSS controls the layout, spacing, and visual style of web interfaces. Frontend roles expect fluency with the box model, flexbox, and responsive design.',
    activity: 'Complete the CSS Fundamentals module on freeCodeCamp and practise with the CSS Grid and Flexbox exercises.',
    project:  'Re-create a real product landing page layout (without copying code) — focusing on responsiveness.',
    category: 'technical',
  },
  'JavaScript': {
    why:      'JavaScript is the core programming language of the web. It is required for virtually all frontend and many backend roles.',
    activity: 'Work through freeCodeCamp\'s JavaScript Algorithms and Data Structures certification exercises.',
    project:  'Build a to-do list app with add, complete, and delete functionality using only vanilla JavaScript.',
    category: 'technical',
  },
  'TypeScript': {
    why:      'TypeScript adds type safety to JavaScript, reducing runtime errors. Many modern teams mandate it — and it signals production-engineering awareness.',
    activity: 'Read the official TypeScript handbook (typescriptlang.org) and convert a small JavaScript project to TypeScript.',
    project:  'Rewrite one of your JavaScript projects in TypeScript, adding explicit types to all functions and components.',
    category: 'technical',
  },
  'React': {
    why:      'React is the most widely used frontend library. It is a required skill for the majority of frontend and full-stack roles in this domain.',
    activity: 'Complete the official React tutorial (react.dev) and build a small multi-component application.',
    project:  'Build a simple expense tracker with a form, list, and a running total — using React state and props.',
    category: 'technical',
  },
  'Vue.js': {
    why:      'Vue.js is a popular frontend framework used heavily in enterprise and startup products across India.',
    activity: 'Follow the official Vue.js documentation\'s guided tutorial to build a note-taking app.',
    project:  'Build a task manager with Vue components, two-way data binding, and a simple filter feature.',
    category: 'technical',
  },
  'Angular': {
    why:      'Angular is widely used in enterprise development. Comfort with its component model, dependency injection, and routing is expected in Angular roles.',
    activity: 'Complete the official Angular "Tour of Heroes" tutorial from angular.dev.',
    project:  'Build a contacts directory app with Angular components, routing between list and detail views.',
    category: 'technical',
  },
  'Tailwind CSS': {
    why:      'Tailwind CSS is increasingly the standard utility-first CSS framework in modern frontend teams. Familiarity speeds up UI work significantly.',
    activity: 'Follow the official Tailwind CSS documentation and build a landing page using only utility classes.',
    project:  'Re-create a responsive card grid layout using Tailwind — practise responsive prefixes (sm:, md:, lg:).',
    category: 'technical',
  },
  'Figma': {
    why:      'Figma is the industry-standard design tool. Even developers benefit from the ability to read, inspect, and work from Figma designs.',
    activity: 'Complete the free "Figma Basics" in-app tutorial and practise inspecting component properties and spacing.',
    project:  'Design and prototype a 3-screen mobile app wireframe for a fictional use case, using auto-layout.',
    category: 'technical',
  },

  // ── Backend ───────────────────────────────────────────────────────────────
  'Node.js': {
    why:      'Node.js is the runtime for JavaScript on the server. It is required for backend, full-stack, and many DevOps roles.',
    activity: 'Follow the official Node.js documentation\'s "Getting Started" guides and build a simple HTTP server.',
    project:  'Build a REST API with three endpoints (list, create, delete) for a resource of your choice using only Node.js built-ins.',
    category: 'technical',
  },
  'Express.js': {
    why:      'Express.js is the most common Node.js web framework. Understanding routing, middleware, and error handling is expected in backend roles.',
    activity: 'Read the official Express.js guide and build a simple CRUD API with in-memory storage.',
    project:  'Build a blog API (posts, authors) with Express — including input validation and a 404 handler.',
    category: 'technical',
  },
  'Python': {
    why:      'Python is used across data science, scripting, automation, and backend roles. It is one of the most in-demand skills on the market.',
    activity: 'Work through freeCodeCamp\'s Scientific Computing with Python certification exercises.',
    project:  'Write a command-line script that reads a CSV file, computes summary statistics, and outputs a report.',
    category: 'technical',
  },
  'Flask': {
    why:      'Flask is Python\'s most popular lightweight web framework for building APIs and small web services.',
    activity: 'Follow the official Flask "Quickstart" and "Tutorial" guides in the Flask documentation.',
    project:  'Build a task management REST API with Flask — supporting create, list, update, and delete operations.',
    category: 'technical',
  },
  'FastAPI': {
    why:      'FastAPI is a modern Python framework for building high-performance APIs with automatic documentation.',
    activity: 'Complete the official FastAPI tutorial at fastapi.tiangolo.com, focusing on path parameters and request bodies.',
    project:  'Build a simple student record API with FastAPI, using Pydantic models for validation.',
    category: 'technical',
  },
  'Django': {
    why:      'Django is Python\'s full-featured web framework. It is widely used in product companies and startups across India.',
    activity: 'Complete the official Django tutorial ("Writing your first Django app") from the Django documentation.',
    project:  'Build a blog application with Django — including models, views, templates, and the admin interface.',
    category: 'technical',
  },

  // ── Data ──────────────────────────────────────────────────────────────────
  'SQL': {
    why:      'SQL is foundational to working with relational databases. Almost every data, backend, and analyst role requires it.',
    activity: 'Complete the "SQL for Beginners" module on freeCodeCamp or the SQLZoo interactive exercises.',
    project:  'Design a database schema for a library system and write queries for common operations: search, filter, aggregate, join.',
    category: 'technical',
  },
  'PostgreSQL': {
    why:      'PostgreSQL is the most widely used production relational database in the Indian startup ecosystem.',
    activity: 'Install PostgreSQL locally, follow the official documentation tutorial, and practise with psql.',
    project:  'Migrate a SQLite database you already have to PostgreSQL, updating queries for dialect differences.',
    category: 'technical',
  },
  'MySQL': {
    why:      'MySQL is the dominant database in legacy systems and many enterprise applications in India.',
    activity: 'Work through the MySQL official Getting Started guide and practise JOIN, GROUP BY, and subquery patterns.',
    project:  'Build a school database with students, courses, and enrolments — write reports using GROUP BY and HAVING.',
    category: 'technical',
  },
  'MongoDB': {
    why:      'MongoDB is the most popular NoSQL database. It is commonly used in full-stack JavaScript applications.',
    activity: 'Complete the free MongoDB University M001 course (MongoDB Basics) — available online.',
    project:  'Build a product catalogue app storing JSON documents, with search by category and price range.',
    category: 'technical',
  },
  'Data Analysis': {
    why:      'Data analysis — cleaning, transforming, and summarising datasets — is the core skill of analyst roles.',
    activity: 'Work through the Kaggle "Intro to Data Analysis" notebook series using pandas and Python.',
    project:  'Download a public dataset (e.g. from data.gov.in), clean it, and produce a summary report with charts.',
    category: 'technical',
  },
  'Pandas': {
    why:      'Pandas is the standard Python library for data manipulation. All data science and analysis roles expect it.',
    activity: 'Complete the official Pandas "Getting Started" tutorial at pandas.pydata.org.',
    project:  'Load a real CSV dataset, compute group summaries, handle missing values, and export a cleaned version.',
    category: 'technical',
  },
  'NumPy': {
    why:      'NumPy provides the numerical computing foundation for Python\'s data science ecosystem.',
    activity: 'Work through the NumPy official quickstart tutorial and practise array operations and broadcasting.',
    project:  'Implement basic statistical functions (mean, median, std dev) using NumPy without scipy.',
    category: 'technical',
  },
  'Machine Learning': {
    why:      'Machine learning is the core technical domain for data science and ML roles. A working conceptual understanding and practical experience are both expected.',
    activity: 'Complete the Kaggle "Intro to Machine Learning" mini-course — it\'s free and uses scikit-learn.',
    project:  'Train a classification model on the Titanic or Iris dataset, evaluate it, and write up your findings.',
    category: 'technical',
  },
  'scikit-learn': {
    why:      'scikit-learn is Python\'s standard ML library. It is the expected tool for building, training, and evaluating models.',
    activity: 'Work through the official scikit-learn user guide, focusing on supervised learning pipelines.',
    project:  'Build an end-to-end pipeline: data loading, preprocessing (scaler, encoder), model training, and evaluation.',
    category: 'technical',
  },
  'TensorFlow': {
    why:      'TensorFlow is one of the two dominant deep learning frameworks. ML Engineer roles frequently require it.',
    activity: 'Complete the official TensorFlow "Quickstart for beginners" tutorial at tensorflow.org.',
    project:  'Build and train a neural network to classify handwritten digits using the MNIST dataset.',
    category: 'technical',
  },
  'PyTorch': {
    why:      'PyTorch is the most widely used deep learning framework in research and increasingly in production.',
    activity: 'Complete the official PyTorch "Learn the Basics" tutorial at pytorch.org.',
    project:  'Re-implement an MNIST classifier using PyTorch — compare it to any TensorFlow or Keras version you have written.',
    category: 'technical',
  },
  'Tableau': {
    why:      'Tableau is the leading visual analytics tool used by analysts and data teams across industries.',
    activity: 'Complete the free "Tableau eLearning" beginner series available on the Tableau website.',
    project:  'Build an interactive dashboard visualising a public dataset — include at least one filter and one calculated field.',
    category: 'technical',
  },
  'Power BI': {
    why:      'Power BI is Microsoft\'s BI tool, dominant in Indian enterprises and consulting firms.',
    activity: 'Follow the Microsoft "Power BI Guided Learning" path available free on Microsoft Learn.',
    project:  'Build a sales performance report with slicers, KPI cards, and a trend line chart using public data.',
    category: 'technical',
  },
  'Microsoft Excel': {
    why:      'Excel is used across virtually every business function. Analyst, BA, and support roles expect strong spreadsheet skills.',
    activity: 'Practise PivotTables, VLOOKUP/XLOOKUP, and conditional formatting on a real dataset.',
    project:  'Build a budget tracker with pivot tables, a summary dashboard, and at least one chart — share it as a portfolio piece.',
    category: 'transferable',
  },

  // ── DevOps / Cloud ────────────────────────────────────────────────────────
  'Git': {
    why:      'Git is the universal version control tool. Every technical role — development, QA, or DevOps — expects it from day one.',
    activity: 'Work through the interactive exercises at learngitbranching.js.org — free and browser-based.',
    project:  'Contribute to any of your existing projects using Git: create branches, make commits, write commit messages, and merge.',
    category: 'technical',
  },
  'Docker': {
    why:      'Docker is the standard container platform. DevOps and backend roles increasingly expect familiarity with containers.',
    activity: 'Complete the official Docker "Get Started" guide at docs.docker.com.',
    project:  'Containerise one of your existing projects — write a Dockerfile, build an image, and run it locally.',
    category: 'technical',
  },
  'Linux': {
    why:      'Linux is the dominant operating system for servers. Backend, DevOps, and cloud roles assume comfort with the command line.',
    activity: 'Work through the "Linux Command Line Basics" exercises — practise navigation, permissions, and process management.',
    project:  'Set up a local Linux environment (or WSL on Windows) and automate a file-management task using a bash script.',
    category: 'technical',
  },
  'Bash/Shell': {
    why:      'Shell scripting automates repetitive tasks and is used in CI/CD, system administration, and DevOps workflows.',
    activity: 'Read the Bash Guide for Beginners (tldp.org) and practise writing scripts for file operations and automation.',
    project:  'Write a bash script that backs up a directory, timestamps the archive, and logs the result to a file.',
    category: 'technical',
  },
  'AWS': {
    why:      'AWS is the world\'s leading cloud platform. Cloud roles and many backend roles expect practical AWS experience.',
    activity: 'Complete the free AWS Cloud Practitioner Essentials training available at aws.amazon.com/training.',
    project:  'Deploy a static website to AWS S3 with public access — then add a CloudFront distribution.',
    category: 'technical',
  },
  'Azure': {
    why:      'Azure is the dominant cloud platform in enterprise and Microsoft-ecosystem environments.',
    activity: 'Follow the Microsoft Learn "Azure Fundamentals" (AZ-900) learning path — free online.',
    project:  'Deploy a simple web application to Azure App Service and configure a custom domain or health check.',
    category: 'technical',
  },
  'REST APIs': {
    why:      'REST APIs are the standard way modern applications communicate. Understanding HTTP methods, status codes, and JSON payloads is required for all backend and full-stack roles.',
    activity: 'Build a small REST API using any backend technology — practise all four HTTP verbs and proper status codes.',
    project:  'Design and document a REST API for a simple domain (e.g. bookstore or cinema) before implementing it.',
    category: 'technical',
  },

  // ── QA / Testing ─────────────────────────────────────────────────────────
  'Software Testing': {
    why:      'Understanding the testing lifecycle, test case design, and defect reporting is the foundational skill of QA roles.',
    activity: 'Study the ISTQB Foundation Level syllabus concepts and practise writing test cases for a real web application.',
    project:  'Write a complete test plan for a web application you know well — covering functional, boundary, and negative cases.',
    category: 'technical',
  },
  'Quality Assurance': {
    why:      'QA goes beyond test execution — it includes process improvement, metrics, and quality culture.',
    activity: 'Learn about test metrics, defect lifecycle, and test management tools by reading QA-focused engineering blogs.',
    project:  'Document a complete bug report (steps to reproduce, severity, expected vs actual) for any bug you find in a real app.',
    category: 'technical',
  },
  'Selenium': {
    why:      'Selenium is the most widely used browser automation framework for web application testing.',
    activity: 'Follow the official Selenium documentation to set up WebDriver and automate a simple login flow.',
    project:  'Write an automated test suite for a public web app (e.g. a search form) with at least 5 test scenarios.',
    category: 'technical',
  },
  'Jest': {
    why:      'Jest is the dominant JavaScript unit testing framework. Frontend and Node.js roles expect comfort with it.',
    activity: 'Complete the official Jest "Getting Started" guide and write tests for an existing JavaScript utility function.',
    project:  'Add Jest tests to an existing JavaScript project — aim for at least one test per exported function.',
    category: 'technical',
  },

  // ── Methodologies ─────────────────────────────────────────────────────────
  'Agile': {
    why:      'Agile is the dominant software development methodology. Most product teams work in sprints and expect candidates to understand its principles.',
    activity: 'Read the Agile Manifesto and study the Scrum Guide (available free at scrum.org).',
    project:  'Run a personal project using a simple Kanban board (Trello or GitHub Projects) — practise backlog, sprint planning, and retrospective.',
    category: 'transferable',
  },
  'Scrum': {
    why:      'Scrum is the most common Agile framework. Understanding ceremonies, roles, and artefacts is expected in most product and development teams.',
    activity: 'Read the official Scrum Guide at scrum.org and watch a Scrum ceremony simulation.',
    project:  'Document a 2-week sprint plan for a small personal project using a backlog, sprint goal, and daily notes.',
    category: 'transferable',
  },
  'Jira': {
    why:      'Jira is the most widely used project and issue tracking tool in the industry.',
    activity: 'Sign up for a free Jira Software account and create a sample project with epics, stories, and tasks.',
    project:  'Track your current learning goals in Jira — create a board, write stories, and move items across statuses.',
    category: 'transferable',
  },
  'UI/UX Design': {
    why:      'UI/UX combines visual design with user research. Design roles require both Figma skills and user-centric thinking.',
    activity: 'Study the Nielsen Norman Group\'s "10 Usability Heuristics" and apply them to critique a real app.',
    project:  'Redesign the onboarding screen of any mobile app you use — document your design decisions and improvements.',
    category: 'transferable',
  },
  'Technical Writing': {
    why:      'Clear, structured documentation is essential for technical writers, developer advocates, and many BA roles.',
    activity: 'Study the Google developer documentation style guide (available free online) and practise rewriting unclear docs.',
    project:  'Write API documentation for one of your own projects — include endpoint descriptions, parameters, and examples.',
    category: 'transferable',
  },
  'Business Analysis': {
    why:      'Business analysis involves requirements gathering, process modelling, and stakeholder communication — core to BA and PM roles.',
    activity: 'Study the BABOK Guide concepts and practise writing user stories and use case diagrams.',
    project:  'Document requirements for a small software feature using user stories, acceptance criteria, and a simple process diagram.',
    category: 'transferable',
  },
  'Project Management': {
    why:      'Project management skills — scope definition, scheduling, risk management — are valued across all professional roles.',
    activity: 'Read the PMI PMBOK Guide\'s introductory chapter and study the five project management process groups.',
    project:  'Create a project plan (scope, timeline, risks) for your personal portfolio website — use a Gantt chart or similar.',
    category: 'transferable',
  },

  // ── Soft skills ───────────────────────────────────────────────────────────
  'Communication': {
    why:      'Communication — verbal and written — is consistently ranked among the top skills hiring managers look for, regardless of technical role.',
    activity: 'Practise structured communication: join a public speaking group, write daily summaries of what you learned, or contribute to open-source discussions.',
    project:  'Record a 3-minute video explanation of a technical concept you know well. Watch it back and refine for clarity and pacing.',
    category: 'soft',
  },
  'Written Communication': {
    why:      'Remote and hybrid teams depend on clear written communication. Technical writing, Slack messages, and documentation all require this skill.',
    activity: 'Write a short technical blog post or README for one of your projects. Ask a peer to review its clarity.',
    project:  'Document a project you have built — include setup instructions, design decisions, and known limitations.',
    category: 'soft',
  },
  'Problem Solving': {
    why:      'Problem-solving ability is a core signal in technical interviews and real-world engineering. Structured approaches are preferred over ad-hoc guessing.',
    activity: 'Practise algorithmic problems on platforms like HackerRank or LeetCode (easy level) — focus on breaking down the problem before coding.',
    project:  'Solve five beginner-level challenges on HackerRank and document your approach for each in plain English.',
    category: 'soft',
  },
  'Critical Thinking': {
    why:      'Critical thinking — evaluating evidence, questioning assumptions, and reasoning to conclusions — is valued in analyst, BA, and leadership roles.',
    activity: 'Practise the "Five Whys" technique on a technical or process problem you encounter this week.',
    project:  'Write a structured analysis of a technology decision (e.g. "Why use PostgreSQL vs MongoDB?") with pros, cons, and a recommendation.',
    category: 'soft',
  },
  'Attention to Detail': {
    why:      'QA, data, design, and writing roles require meticulous accuracy. This skill prevents costly errors and demonstrates professionalism.',
    activity: 'Review code or documentation you have previously written and find at least five improvements.',
    project:  'Perform a manual accessibility audit of a web page you built — check heading hierarchy, alt text, colour contrast, and keyboard navigation.',
    category: 'soft',
  },
  'Teamwork': {
    why:      'All professional roles involve collaboration. Demonstrating the ability to work in a team — including remotely — is expected.',
    activity: 'Contribute to an open-source project on GitHub — even documentation improvements count.',
    project:  'Participate in a hackathon or collaborate with a peer on a small project, tracking your contributions with Git.',
    category: 'soft',
  },
  'Leadership': {
    why:      'Even at entry level, demonstrating initiative and the ability to guide others strengthens your profile.',
    activity: 'Volunteer to lead a small group project at college, in a community, or in an open-source initiative.',
    project:  'Organise and document a study group session on a technical topic — create an agenda and share notes afterwards.',
    category: 'soft',
  },
  'Presentation Skills': {
    why:      'The ability to present ideas clearly — to technical and non-technical audiences — is valued across BA, PM, and leadership roles.',
    activity: 'Prepare and deliver a 10-minute presentation on a project you have built. Focus on: what problem it solves, how it works, and what you learned.',
    project:  'Create a slide deck for one of your projects and present it to a peer. Record their questions and refine the presentation.',
    category: 'soft',
  },
  'Customer Support': {
    why:      'Customer-facing communication and empathy are core to support and IT roles.',
    activity: 'Study ITIL Foundation concepts and practise writing clear, empathetic responses to simulated support tickets.',
    project:  'Write 5 sample support ticket responses covering common IT issues — focus on tone, accuracy, and resolution steps.',
    category: 'transferable',
  },
  'SEO': {
    why:      'SEO knowledge enables digital marketing professionals to improve content visibility and organic reach.',
    activity: 'Complete the Google Search Central SEO Starter Guide — it is free and authoritative.',
    project:  'Audit the SEO of a page you own or a public website — document at least 5 improvements with reasoning.',
    category: 'transferable',
  },
  'Digital Marketing': {
    why:      'Digital marketing combines content, SEO, paid channels, and analytics. Understanding the full funnel is expected in marketing roles.',
    activity: 'Complete the Google Digital Garage "Fundamentals of Digital Marketing" certification — it is free.',
    project:  'Create a 30-day content plan for a fictional product, including audience definition, channels, and KPIs.',
    category: 'transferable',
  },
  'Content Writing': {
    why:      'Content writing requires the ability to communicate ideas clearly to a target audience. Strong writing is foundational for marketing and communications roles.',
    activity: 'Write three short blog posts on topics you know well. Aim for clarity, structure, and a consistent voice.',
    project:  'Write a case study documenting a project you completed — what problem you solved, your approach, and the outcome.',
    category: 'transferable',
  },
  'Documentation': {
    why:      'Clear documentation reduces onboarding time, prevents knowledge loss, and is expected of professional developers and analysts.',
    activity: 'Review and improve the README or documentation for one of your existing projects.',
    project:  'Write a "How it works" guide for your most recent project — targeting a developer who is unfamiliar with your code.',
    category: 'transferable',
  },
};

// ── Priority assignment ───────────────────────────────────────────────────────

/**
 * Assigns priority to a missing skill based on its position in required vs preferred lists.
 * Required skills get High priority; preferred skills get Medium.
 * Skills with no dataset entry get Low.
 */
function assignPriority(skillName, isRequired) {
  return isRequired ? 'high' : 'medium';
}

/**
 * Builds a recommendation object for a given skill name.
 * Falls back to a generic recommendation if the skill is not in the knowledge base.
 */
function getRecommendation(skillName, isRequired) {
  const rec = SKILL_RECS[skillName];
  const priority = assignPriority(skillName, isRequired);

  if (!rec) {
    return {
      skillName,
      priority,
      why:      `${skillName} is listed as a ${isRequired ? 'required' : 'preferred'} skill for this role.`,
      activity: `Study the official documentation or a reputable guide for ${skillName}. Build a small project that demonstrates your ability.`,
      project:  `Create a minimal working example using ${skillName} and add it to your portfolio with documentation.`,
      category: 'technical',
    };
  }

  return {
    skillName,
    priority,
    why:      rec.why,
    activity: rec.activity,
    project:  rec.project,
    category: rec.category,
  };
}

module.exports = { getRecommendation, SKILL_RECS };
