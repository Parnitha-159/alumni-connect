const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('./db');

async function seed() {
  console.log('Starting seed process...');
  await initDb();
  const db = await getDb();

  // Clear existing tables
  await db.exec('DELETE FROM mentorship_requests');
  await db.exec('DELETE FROM success_stories');
  await db.exec('DELETE FROM jobs');
  await db.exec('DELETE FROM rsvps');
  await db.exec('DELETE FROM events');
  await db.exec('DELETE FROM discussions');
  await db.exec('DELETE FROM alumni_profiles');
  await db.exec('DELETE FROM users');

  // Helper for password hashing
  const hashPassword = async (pwd) => {
    return await bcrypt.hash(pwd, 10);
  };

  const adminHash = await hashPassword('admin123');
  const studentHash = await hashPassword('student123');
  const alumniHash = await hashPassword('alumni123');

  // 1. Seed Admin
  const adminResult = await db.run(
    'INSERT INTO users (email, password_hash, role, name, approved) VALUES (?, ?, ?, ?, ?)',
    ['admin@vsb.edu', adminHash, 'admin', 'System Admin', 1]
  );
  console.log('Seeded Admin.');

  // 2. Seed Student
  const studentResult = await db.run(
    'INSERT INTO users (email, password_hash, role, name, department, approved) VALUES (?, ?, ?, ?, ?, ?)',
    ['student@vsb.edu', studentHash, 'student', 'Anjali Devi', 'ECE', 1]
  );
  const studentId = studentResult.lastID;
  console.log('Seeded Student.');

  // 3. Seed Alumni
  const alumniData = [
    {
      email: 'priya.ramesh@zoho.com',
      name: 'Priya Ramesh',
      batch: 2020,
      dept: 'ECE',
      company: 'Zoho',
      role: 'Software Engineer',
      location: 'Chennai',
      linkedin: 'https://linkedin.com/in/priyaramesh-zoho',
      phone: '9876543210',
      mentorOptIn: 1,
      expertise: 'Web Development',
      bio: 'Loves crafting pixel-perfect interfaces and exploring frontend frameworks.'
    },
    {
      email: 'karthik.subramanian@bosch.com',
      name: 'Karthik Subramanian',
      batch: 2019,
      dept: 'ECE',
      company: 'Bosch',
      role: 'Embedded Systems Engineer',
      location: 'Bengaluru',
      linkedin: 'https://linkedin.com/in/karthiksubramanian-bosch',
      phone: '9876543211',
      mentorOptIn: 1,
      expertise: 'Embedded Systems / VLSI',
      bio: 'Fascinated by microcontroller architectures and hardware-software co-design.'
    },
    {
      email: 'divya.anand@tum.de',
      name: 'Divya Anand',
      batch: 2021,
      dept: 'ECE',
      company: 'TU Munich',
      role: 'MS Communication Engineering',
      location: 'Germany',
      linkedin: 'https://linkedin.com/in/divyaanand-tum',
      phone: '9876543212',
      mentorOptIn: 1,
      expertise: 'Higher Studies Abroad - GRE/IELTS guidance',
      bio: 'Graduate student diving deep into 5G/6G communication systems and network routing.'
    },
    {
      email: 'arun.kumar@isro.gov.in',
      name: 'Arun Kumar',
      batch: 2018,
      dept: 'ECE',
      company: 'ISRO',
      role: 'Core Electronics Engineer',
      location: 'Trivandrum',
      linkedin: 'https://linkedin.com/in/arunkumar-isro',
      phone: '9876543213',
      mentorOptIn: 1,
      expertise: 'Core Electronics Jobs',
      bio: 'Working on satellite communication telemetry and RF hardware design.'
    },
    {
      email: 'sneha.ravi@freshworks.com',
      name: 'Sneha Ravi',
      batch: 2022,
      dept: 'ECE',
      company: 'Freshworks',
      role: 'Frontend Developer',
      location: 'Chennai',
      linkedin: 'https://linkedin.com/in/sneharavi-freshworks',
      phone: '9876543214',
      mentorOptIn: 1,
      expertise: 'Web Development',
      bio: 'Passionate about building fast, responsive, and accessible web experiences.'
    },
    {
      email: 'vignesh.rajan@qualcomm.com',
      name: 'Vignesh Rajan',
      batch: 2017,
      dept: 'ECE',
      company: 'Qualcomm',
      role: 'VLSI Design Engineer',
      location: 'Hyderabad',
      linkedin: 'https://linkedin.com/in/vigneshrajan-qualcomm',
      phone: '9876543215',
      mentorOptIn: 1,
      expertise: 'Embedded Systems / VLSI',
      bio: 'Focusing on physical design and verification of high-performance mobile chipsets.'
    },
    {
      email: 'meera.krishnan@ssc.gov.in',
      name: 'Meera Krishnan',
      batch: 2020,
      dept: 'ECE',
      company: 'Central Government',
      role: 'Government Officer (SSC Qualified)',
      location: 'Chennai',
      linkedin: 'https://linkedin.com/in/meerakrishnan-ssc',
      phone: '9876543216',
      mentorOptIn: 1,
      expertise: 'Government Exams',
      bio: 'Cracked the SSC CGLE. Happy to guide aspirants through general awareness and aptitude tests.'
    },
    {
      email: 'rahul.prasad@startup.com',
      name: 'Rahul Prasad',
      batch: 2019,
      dept: 'ECE',
      company: 'IoT Startup',
      role: 'Founder',
      location: 'Coimbatore',
      linkedin: 'https://linkedin.com/in/rahulprasad-founder',
      phone: '9876543217',
      mentorOptIn: 1,
      expertise: 'Entrepreneurship / Startups',
      bio: 'Serial entrepreneur building IoT solutions for agriculture and smart cities.'
    }
  ];

  const alumniMap = {};

  for (const a of alumniData) {
    const userRes = await db.run(
      'INSERT INTO users (email, password_hash, role, approved) VALUES (?, ?, ?, ?)',
      [a.email, alumniHash, 'alumni', 1]
    );
    const userId = userRes.lastID;
    
    // We generate a clean generic avatar URL or use initials
    const initials = a.name.split(' ').map(n => n[0]).join('');
    const profilePhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=0F4C4C&color=fff&size=200`;

    await db.run(
      `INSERT INTO alumni_profiles (
        user_id, name, batch_year, department, current_company, current_role, 
        location, linkedin, phone, profile_photo, bio, mentor_opt_in, mentor_expertise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, a.name, a.batch, a.dept, a.company, a.role, 
        a.location, a.linkedin, a.phone, profilePhoto, a.bio, a.mentorOptIn, a.expertise
      ]
    );

    alumniMap[a.name] = userId;
  }
  console.log(`Seeded ${alumniData.length} Alumni Profiles.`);

  // 4. Seed Success Stories
  const stories = [
    {
      authorName: 'Priya Ramesh',
      headline: 'From ECE to Frontend at Zoho',
      writeup: 'Started as an ECE student unsure about coding, picked up web development in my final year through self-study and internships. Landed my first role at Zoho as a frontend developer, now leading a small team building internal tools.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
    },
    {
      authorName: 'Karthik Subramanian',
      headline: 'Building Automotive Sensors at Bosch',
      writeup: 'My VLSI and embedded systems coursework at VSB gave me the foundation. After an in-plant training and a core internship, I joined Bosch working on automotive sensor firmware.',
      photo: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=400'
    },
    {
      authorName: 'Divya Anand',
      headline: "Pursuing a Master's in Germany",
      writeup: 'Always wanted to study abroad. Cleared GRE and IELTS during final year, got into TU Munich for a Master\'s in Communication Engineering. Now researching 5G network optimization.',
      photo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=400'
    }
  ];

  for (const s of stories) {
    const authorId = alumniMap[s.authorName];
    await db.run(
      `INSERT INTO success_stories (headline, writeup, photo, author_id, author_name, department, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.headline, s.writeup, s.photo, authorId, s.authorName, 'ECE', 1]
    );
  }
  console.log('Seeded Success Stories.');

  // 5. Seed Jobs
  const jobs = [
    {
      authorName: 'Priya Ramesh',
      title: 'Frontend Developer Intern',
      company: 'Zoho',
      location: 'Chennai',
      type: 'Internship',
      duration: '3 months',
      description: 'Role: Frontend Developer Intern. Location: Chennai (Remote/Hybrid options). Duration: 3 months. Responsibilities: Work with HTML, CSS, JavaScript, and custom frameworks to build web applications. Basic knowledge of DOM manipulation is required.'
    },
    {
      authorName: 'Karthik Subramanian',
      title: 'Embedded Systems Trainee',
      company: 'Bosch',
      location: 'Bengaluru',
      type: 'Full-time',
      duration: 'Permanent',
      description: 'Role: Embedded Systems Trainee. Location: Bengaluru. Responsibilities: Develop micro-controller firmware, work on sensor integration, and support testing. Ideal for fresh graduates with a solid foundation in C programming and basic electronics.'
    }
  ];

  for (const j of jobs) {
    const posterId = alumniMap[j.authorName];
    await db.run(
      `INSERT INTO jobs (poster_id, title, company, location, type, duration, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [posterId, j.title, j.company, j.location, j.type, j.duration, j.description]
    );
  }
  console.log('Seeded Jobs.');

  // 6. Seed Events
  const events = [
    {
      title: 'Alumni Meet 2026',
      date: '2026-12-20',
      location: 'VSB Engineering College Campus',
      description: 'Annual reunion for all alumni. Come reconnect, share memories, and inspire the next generation of engineers. Lunch and refreshments will be provided.',
      baseRsvpCount: 45
    },
    {
      title: 'Webinar: Career Paths in VLSI',
      date: '2026-08-15',
      location: 'Online (Zoom)',
      description: 'Qualcomm & Bosch engineers share insights about structural design, digital design verification, tools, and hardware placement processes. Perfect for current ECE students.',
      baseRsvpCount: 32
    }
  ];

  for (const e of events) {
    await db.run(
      `INSERT INTO events (title, date, location, description, base_rsvp_count) 
       VALUES (?, ?, ?, ?, ?)`,
      [e.title, e.date, e.location, e.description, e.baseRsvpCount]
    );
  }
  console.log('Seeded Events.');

  // 7. Seed Mentorship Request
  const divyaId = alumniMap['Divya Anand'];
  await db.run(
    `INSERT INTO mentorship_requests (student_id, mentor_id, request_message, status) 
     VALUES (?, ?, ?, ?)`,
    [
      studentId, 
      divyaId, 
      'Interested in higher studies in Germany, would love guidance on GRE prep and university selection.', 
      'Accepted'
    ]
  );
  console.log('Seeded Mentorship Request.');

  // 8. Seed Discussion Post
  await db.run(
    `INSERT INTO discussions (user_id, user_name, user_role, title, content)
     VALUES (?, ?, ?, ?, ?)`,
    [
      divyaId,
      'Divya Anand',
      'alumni',
      'Welcome to ECE Alumni Connect!',
      'Hello juniors and fellow alumni! I hope this platform serves as an excellent bridging ground. Feel free to ask questions about core fields, VLSI, higher education, or startup structures here.'
    ]
  );
  console.log('Seeded Discussion Board Post.');

  console.log('Database seeding completed successfully!');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Error seeding database:', err);
  });
}

module.exports = seed;
