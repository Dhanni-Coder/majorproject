import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FaGraduationCap, FaChalkboardTeacher, FaBook, FaUsers,
  FaQrcode, FaChartBar, FaCalendarAlt, FaBell, FaLaptopCode,
  FaServer, FaPalette, FaMobileAlt, FaDatabase, FaCogs,
  FaArrowRight, FaGithub, FaLinkedin, FaTwitter, FaEnvelope
} from 'react-icons/fa';
import '../styles/Home.css';

const Home = () => {
  const [isVisible, setIsVisible] = useState({});
  const refs = {
    hero: useRef(null),
    features: useRef(null),
    about: useRef(null),
    team: useRef(null),
    stats: useRef(null),
    cta: useRef(null)
  };

  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Varun',
      role: 'Frontend Developer',
      image: '/src/public/varun.png',
      bio: 'Passionate about creating beautiful and intuitive user interfaces with React. Specializes in responsive design and modern UI frameworks.',
      contribution: 'Developed the modern dashboard interfaces and interactive components throughout the application.',
      skills: ['React', 'JavaScript', 'CSS', 'UI/UX', 'Animation'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      id: 2,
      name: 'Dev Singh',
      role: 'Backend Engineer',
      image: '/src/public/art11.jpeg',
      bio: 'Experienced in building robust server-side applications and RESTful APIs with a focus on security and performance.',
      contribution: 'Architected the backend services, authentication system, and database integration.',
      skills: ['Node.js', 'Express', 'MongoDB', 'API Design', 'Security'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      id: 3,
      name: 'Vineet',
      role: 'UI/UX Designer',
      image: '/src/public/art21.png',
      bio: 'Focused on creating delightful user experiences through thoughtful design and user research.',
      contribution: 'Designed the user interface, created wireframes, and conducted usability testing.',
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Accessibility'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      id: 4,
      name: 'Ayush Semwal',
      role: 'Full Stack Developer',
      image: '/src/public/art3.png',
      bio: 'Versatile developer with expertise in both frontend and backend technologies, specializing in educational technology.',
      contribution: 'Implemented the attendance system, QR code functionality, and student dashboard features.',
      skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'QR Technology'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      id: 5,
      name: 'Bhaskar Semwal',
      role: 'Database Architect',
      image: '/src/public/art2.png',
      bio: 'Specializes in designing efficient database schemas and optimizing queries for educational management systems.',
      contribution: 'Designed the database structure, implemented data models, and optimized query performance.',
      skills: ['MongoDB', 'SQL', 'Data Modeling', 'Performance Tuning', 'Data Security'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      id: 6,
      name: 'Aryan Rawat',
      role: 'Project Manager',
      image: '/src/public/art.png',
      bio: 'Ensures smooth project execution and effective communication among team members with a background in educational administration.',
      contribution: 'Coordinated the project timeline, managed resources, and ensured alignment with educational requirements.',
      skills: ['Agile', 'Scrum', 'Team Leadership', 'Strategic Planning', 'Education Management'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    }
  ];

  // Features data
  const features = [
    {
      icon: <FaQrcode />,
      title: 'QR Authentication',
      description: 'Secure and quick login with personalized QR codes for students and staff.'
    },
    {
      icon: <FaChartBar />,
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with comprehensive analytics and reports.'
    },
    {
      icon: <FaBook />,
      title: 'Digital Library',
      description: 'Access and manage the entire library catalog with easy book checkout system.'
    },
    {
      icon: <FaCalendarAlt />,
      title: 'Class Scheduling',
      description: 'Efficient class scheduling and management for teachers and students.'
    },
    {
      icon: <FaBell />,
      title: 'Notice Board',
      description: 'Instant notifications and announcements for the entire institution.'
    },
    {
      icon: <FaUsers />,
      title: 'User Management',
      description: 'Comprehensive user management system with role-based access control.'
    }
  ];

  // Stats data
  const stats = [
    { value: '5,000+', label: 'Students' },
    { value: '200+', label: 'Teachers' },
    { value: '50+', label: 'Courses' },
    { value: '98%', label: 'Satisfaction' }
  ];

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section refs
    Object.entries(refs).forEach(([key, ref]) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      // Cleanup observer
      Object.values(refs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        id="hero"
        ref={refs.hero}
        className={`hero-section ${isVisible.hero ? 'animate-in' : ''}`}
      >
        <div className="hero-content">
          <div className="college-logo">
            <img src="/src/public/logo.webp" alt="Government Polytechnic Dehradun"/>
          </div>
          <h1 className="hero-title">
            <span className="highlight">Student</span> Management System
          </h1>
          <h2 className="college-name">Government Polytechnic Dehradun</h2>
          <p className="hero-subtitle">
            A modern solution for educational institutions to streamline administration,
            enhance learning experiences, and connect the academic community.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">
              LOGIN <FaArrowRight className="icon" />
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/src/public/college.webp" alt="College Management System" />
        </div>
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={refs.features}
        className={`features-section ${isVisible.features ? 'animate-in' : ''}`}
      >
        <div className="section-header">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">
            Discover the tools that make the ultimate student management solution
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        ref={refs.about}
        className={`about-section ${isVisible.about ? 'animate-in' : ''}`}
      >
        <div className="about-content">
          <div className="section-header">
            <h2 className="section-title">About Student Management System</h2>
            <p className="section-subtitle">
              Transforming education management with innovative technology
            </p>
          </div>
          <p className="about-text">
            Student Management System is a comprehensive college management system designed to address the unique
            challenges faced by educational institutions. Our platform integrates cutting-edge
            technology with user-friendly interfaces to create a seamless experience for administrators,
            teachers, and students alike.
          </p>
          <p className="about-text">
            With features like QR code authentication, real-time attendance tracking, digital library
            management, and intuitive dashboards, Student Management System empowers institutions to focus on what
            matters most: providing quality education.
          </p>
          <div className="about-highlights">
            <div className="highlight">
              <FaGraduationCap className="highlight-icon" />
              <h3>Student-Centered</h3>
              <p>Designed with students' needs in mind</p>
            </div>
            <div className="highlight">
              <FaChalkboardTeacher className="highlight-icon" />
              <h3>Teacher-Friendly</h3>
              <p>Intuitive tools for educators</p>
            </div>
            <div className="highlight">
              <FaCogs className="highlight-icon" />
              <h3>Admin <br />Acess</h3>
              <p>Simplified management processes</p>
            </div>
          </div>
        </div>
        <div className="about-image">
          <img src="/src/public/clg2.webp" alt="About Student Management System" />
        </div>
      </section>

      {/* Team Section */}
      <section
        id="team"
        ref={refs.team}
        className={`team-section ${isVisible.team ? 'animate-in' : ''}`}
      >
        <div className="section-header">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-subtitle">
            The talented individuals behind Student Management System
          </p>
        </div>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              className="team-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="team-card-inner">
                <div className="team-card-front">
                  <div className="member-image">
                    <img
                      src={member.image}
                      alt={member.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.svg';
                      }}
                    />
                  </div>
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                </div>
                <div className="team-card-back">
                  <p className="member-bio">{member.bio}</p>
                  <div className="member-contribution">
                    <h4>Contribution:</h4>
                    <p>{member.contribution}</p>
                  </div>
                  <div className="member-skills">
                    {member.skills.map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  <div className="member-social">
                    <a href={member.social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                      <FaGithub />
                    </a>
                    <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <FaLinkedin />
                    </a>
                    <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <FaTwitter />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
