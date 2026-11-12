/**
 * skillSuggestions.js
 *
 * Curated skill suggestions shown in the onboarding profile builder.
 * These are SUGGESTIONS only — users must explicitly select or type a skill.
 * Derived from shared/skillTaxonomy.json canonical values, grouped by category.
 */

export const TECHNICAL_SKILLS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Kotlin', 'Swift',
  // Frontend
  'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'React Native', 'Flutter', 'Sass/SCSS', 'Tailwind CSS',
  // Backend
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI',
  // Databases
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite',
  // Tools & DevOps
  'Git', 'Docker', 'Linux', 'Bash/Shell', 'AWS', 'Azure', 'Google Cloud',
  // APIs & Data
  'REST APIs', 'GraphQL', 'JSON',
  // Data & ML
  'Data Analysis', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Tableau', 'Power BI',
  // Design
  'Figma', 'Adobe Photoshop',
  // Testing
  'Software Testing', 'Quality Assurance', 'Unit Testing', 'Jest', 'Selenium',
  // Productivity
  'Microsoft Excel', 'Microsoft Word', 'Microsoft PowerPoint',
];

export const SOFT_SKILLS = [
  'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
  'Leadership', 'Time Management', 'Adaptability', 'Creativity',
  'Attention to Detail', 'Presentation Skills', 'Written Communication',
  'Active Listening', 'Collaboration', 'Self-Motivation',
];

// Renamed from DOMAIN_SKILLS — category is now 'transferable' throughout the app
export const TRANSFERABLE_SKILLS = [
  'Agile', 'Scrum', 'Jira', 'Project Management', 'Product Management',
  'UI/UX Design', 'Technical Writing', 'Business Analysis',
  'Digital Marketing', 'SEO', 'Content Writing',
  'Customer Support', 'Sales', 'Finance Basics', 'Accounting',
  'Research', 'Data Entry', 'MS Office Suite',
];

// Legacy alias — keeps existing imports working during transition
export const DOMAIN_SKILLS = TRANSFERABLE_SKILLS;

export const ALL_SUGGESTIONS = [
  ...TECHNICAL_SKILLS.map(s    => ({ label: s, category: 'technical'    })),
  ...SOFT_SKILLS.map(s         => ({ label: s, category: 'soft'         })),
  ...TRANSFERABLE_SKILLS.map(s => ({ label: s, category: 'transferable' })),
];

export const JOB_ROLE_SUGGESTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'React Developer', 'Node.js Developer', 'Python Developer',
  'Data Analyst', 'Data Science Intern', 'ML Engineer',
  'UI/UX Designer', 'Graphic Designer', 'Product Designer',
  'QA Engineer', 'Software Tester', 'DevOps Engineer',
  'Business Analyst', 'Technical Writer', 'Cloud Engineer',
  'Mobile App Developer', 'React Native Developer', 'Flutter Developer',
  'IT Support Engineer', 'Junior Software Engineer', 'Software Development Intern',
];

export const DOMAIN_SUGGESTIONS = [
  'Web Development', 'Mobile Development', 'Data Science & Analytics',
  'Machine Learning & AI', 'Cloud & DevOps', 'UI/UX & Design',
  'Quality Assurance', 'Business Analysis', 'Product Management',
  'Technical Writing', 'Cybersecurity', 'Embedded Systems',
  'E-commerce', 'EdTech', 'FinTech', 'HealthTech', 'SaaS',
];

export const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'onsite',   label: 'On-site (office)' },
  { value: 'hybrid',   label: 'Hybrid (mixed)' },
  { value: 'remote',   label: 'Remote' },
  { value: 'flexible', label: 'Flexible / No preference' },
];

export const CURRENT_STATUS_OPTIONS = [
  { value: 'final_year',        label: 'Final-year student' },
  { value: 'recent_graduate',   label: 'Recent graduate (0–2 years)' },
  { value: 'self_taught',       label: 'Self-taught learner' },
  { value: 'career_changer',    label: 'Career changer' },
  { value: 'other',             label: 'Other' },
];

export const QUALIFICATION_OPTIONS = [
  'B.E. / B.Tech', 'B.Sc', 'B.Com', 'BCA', 'BA', 'BBA', 'BMS',
  'M.E. / M.Tech', 'M.Sc', 'MBA', 'MCA', 'MA',
  'Diploma (Engineering)', 'Diploma (Other)',
  'Class XII (PUC)', 'Self-taught / No formal degree', 'Other',
];

export const EXPERIENCE_TYPES = [
  { value: 'academic_project',  label: 'Academic Project' },
  { value: 'personal_project',  label: 'Personal Project' },
  { value: 'internship',        label: 'Internship' },
  { value: 'freelance',         label: 'Freelance / Contract' },
  { value: 'volunteer',         label: 'Volunteer Work' },
  { value: 'part_time',         label: 'Part-time Job' },
  { value: 'other',             label: 'Other Experience' },
];
