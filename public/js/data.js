/**
 * MediCare Plus — Seed Data & Data Helpers
 * Offline-first localStorage-friendly dataset. No backend required.
 *
 * Usage (browser):
 *   <script src="js/data.js"></script>
 *   const doc = MediCareData.getDoctor('d1');
 *
 * Also attaches as window.MediCareData for non-module pages.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Unsplash medical image helpers                                    */
  /* ------------------------------------------------------------------ */
  const img = (id, w = 800) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

  /* ------------------------------------------------------------------ */
  /*  Hospital info                                                     */
  /* ------------------------------------------------------------------ */
  const hospital = {
    name: 'MediCare Plus',
    tagline: 'Compassion. Excellence. Care.',
    phone: '+1 (800) 555-0147',
    emergency: '108 / +1-800-911-HELP',
    email: 'info@medicareplus.com',
    supportEmail: 'support@medicareplus.com',
    address: '1250 Healing Way, Suite 100, Health City, HC 90210',
    city: 'Health City',
    hours: {
      weekdays: 'Mon – Fri: 8:00 AM – 8:00 PM',
      saturday: 'Sat: 9:00 AM – 5:00 PM',
      sunday: 'Sun: Emergency Only',
      display: 'Mon–Fri 8AM–8PM · Sat 9AM–5PM · Sun Emergency Only',
    },
    social: {
      facebook: 'https://facebook.com/medicareplus',
      twitter: 'https://twitter.com/medicareplus',
      instagram: 'https://instagram.com/medicareplus',
      linkedin: 'https://linkedin.com/company/medicareplus',
      youtube: 'https://youtube.com/@medicareplus',
    },
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022!2d-73.9857!3d40.7484',
  };

  /* ------------------------------------------------------------------ */
  /*  Departments (8)                                                   */
  /* ------------------------------------------------------------------ */
  const departments = [
    {
      id: 'cardiology',
      name: 'Cardiology',
      icon: 'fa-solid fa-heart-pulse',
      description:
        'Advanced heart care including diagnostics, interventional cardiology, and cardiac rehabilitation with state-of-the-art cath labs.',
      image: img('photo-1628348068343-c6a848dcebbc'),
      doctors: 4,
      beds: 24,
    },
    {
      id: 'neurology',
      name: 'Neurology',
      icon: 'fa-solid fa-brain',
      description:
        'Comprehensive brain and nervous system care — stroke, epilepsy, migraine, and neurodegenerative disease management.',
      image: img('photo-1559757175-5700dde9bc39'),
      doctors: 3,
      beds: 18,
    },
    {
      id: 'orthopedics',
      name: 'Orthopedics',
      icon: 'fa-solid fa-bone',
      description:
        'Joint replacement, sports medicine, spine care, and fracture treatment with modern arthroscopic techniques.',
      image: img('photo-1579684385127-1ef15d508118'),
      doctors: 3,
      beds: 20,
    },
    {
      id: 'pediatrics',
      name: 'Pediatrics',
      icon: 'fa-solid fa-baby',
      description:
        'Gentle, family-centered care for infants, children, and teens — from wellness checks to specialized pediatric medicine.',
      image: img('photo-1631217868264-e5b90bb7e133'),
      doctors: 3,
      beds: 16,
    },
    {
      id: 'dental',
      name: 'Dental',
      icon: 'fa-solid fa-tooth',
      description:
        'Preventive dentistry, cosmetic smile design, implants, and oral surgery in a calm, modern clinic setting.',
      image: img('photo-1606811841689-23dfddce3e95'),
      doctors: 2,
      beds: 8,
    },
    {
      id: 'ophthalmology',
      name: 'Ophthalmology',
      icon: 'fa-solid fa-eye',
      description:
        'Complete eye care including cataract surgery, glaucoma management, retinal services, and pediatric ophthalmology.',
      image: img('photo-1576091160399-112ba8d25d1d'),
      doctors: 2,
      beds: 10,
    },
    {
      id: 'gynecology',
      name: 'Gynecology',
      icon: 'fa-solid fa-person-pregnant',
      description:
        'Women’s health across every life stage — prenatal care, fertility support, minimally invasive gynecologic surgery.',
      image: img('photo-1581595220892-b24562acb1e4'),
      doctors: 2,
      beds: 14,
    },
    {
      id: 'dermatology',
      name: 'Dermatology',
      icon: 'fa-solid fa-hand-holding-medical',
      description:
        'Medical and cosmetic dermatology for skin, hair, and nails — acne, eczema, skin cancer screening, and laser therapy.',
      image: img('photo-1612349317150-e413f6a5b16d'),
      doctors: 2,
      beds: 6,
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Doctors (12)                                                      */
  /* ------------------------------------------------------------------ */
  const doctors = [
    {
      id: 'd1',
      name: 'Dr. Sarah Mitchell',
      specialty: 'Interventional Cardiologist',
      departmentId: 'cardiology',
      experience: 15,
      rating: 4.9,
      reviews: 218,
      image: img('photo-1559839734-2b71ea197ec2', 600),
      education: 'MD, Harvard Medical School · Fellowship, Cleveland Clinic',
      bio: 'Dr. Mitchell specializes in complex coronary interventions and preventive cardiology. She leads our Heart Wellness Program.',
      fees: 180,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
        times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      },
      gender: 'female',
      languages: ['English', 'Spanish'],
    },
    {
      id: 'd2',
      name: 'Dr. James Chen',
      specialty: 'Cardiac Electrophysiologist',
      departmentId: 'cardiology',
      experience: 12,
      rating: 4.8,
      reviews: 156,
      image: img('photo-1612349317150-e413f6a5b16d', 600),
      education: 'MD, Johns Hopkins · EP Fellowship, Mayo Clinic',
      bio: 'Expert in arrhythmia management, pacemaker implantation, and atrial fibrillation ablation.',
      fees: 200,
      availability: {
        days: ['Monday', 'Thursday', 'Friday'],
        times: ['10:00', '11:00', '13:00', '14:00', '15:00'],
      },
      gender: 'male',
      languages: ['English', 'Mandarin'],
    },
    {
      id: 'd3',
      name: 'Dr. Priya Sharma',
      specialty: 'Neurologist',
      departmentId: 'neurology',
      experience: 14,
      rating: 4.9,
      reviews: 192,
      image: img('photo-1594824476967-48c8b964273f', 600),
      education: 'MD, AIIMS · Fellowship, Mass General Neurology',
      bio: 'Focuses on stroke prevention, epilepsy, and multiple sclerosis with a patient-first approach.',
      fees: 170,
      availability: {
        days: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      },
      gender: 'female',
      languages: ['English', 'Hindi'],
    },
    {
      id: 'd4',
      name: 'Dr. Michael Torres',
      specialty: 'Neurosurgeon',
      departmentId: 'neurology',
      experience: 18,
      rating: 4.7,
      reviews: 134,
      image: img('photo-1622253692010-333f2da6031d', 600),
      education: 'MD, Stanford · Neurosurgery Residency, UCSF',
      bio: 'Performs minimally invasive spine and brain procedures with excellent recovery outcomes.',
      fees: 250,
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'],
        times: ['09:00', '11:00', '13:00', '15:00'],
      },
      gender: 'male',
      languages: ['English', 'Spanish'],
    },
    {
      id: 'd5',
      name: 'Dr. Emily Watson',
      specialty: 'Orthopedic Surgeon',
      departmentId: 'orthopedics',
      experience: 11,
      rating: 4.8,
      reviews: 167,
      image: img('photo-1651008376811-b90baee60c1f', 600),
      education: 'MD, UCLA · Sports Medicine Fellowship, Hospital for Special Surgery',
      bio: 'Specializes in knee and hip replacement and sports injury recovery for athletes of all ages.',
      fees: 190,
      availability: {
        days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'],
      },
      gender: 'female',
      languages: ['English'],
    },
    {
      id: 'd6',
      name: 'Dr. Robert Kim',
      specialty: 'Spine Specialist',
      departmentId: 'orthopedics',
      experience: 16,
      rating: 4.6,
      reviews: 121,
      image: img('photo-1537368910025-700350fe46c7', 600),
      education: 'MD, Yale · Orthopedic Spine Fellowship, Rothman Institute',
      bio: 'Treats complex spine disorders with both surgical and non-surgical pathways.',
      fees: 210,
      availability: {
        days: ['Tuesday', 'Wednesday', 'Saturday'],
        times: ['09:00', '10:00', '11:00', '13:00', '14:00'],
      },
      gender: 'male',
      languages: ['English', 'Korean'],
    },
    {
      id: 'd7',
      name: 'Dr. Aisha Patel',
      specialty: 'Pediatrician',
      departmentId: 'pediatrics',
      experience: 10,
      rating: 5.0,
      reviews: 245,
      image: img('photo-1551836022-d5d88e9218df', 600),
      education: 'MD, Columbia · Pediatrics Residency, Children’s Hospital of Philadelphia',
      bio: 'Beloved for her warm bedside manner and expertise in childhood development and vaccines.',
      fees: 120,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        times: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
      },
      gender: 'female',
      languages: ['English', 'Gujarati'],
    },
    {
      id: 'd8',
      name: 'Dr. David Okonkwo',
      specialty: 'Pediatric Cardiologist',
      departmentId: 'pediatrics',
      experience: 13,
      rating: 4.9,
      reviews: 98,
      image: img('photo-1582750433449-648ed127bb54', 600),
      education: 'MD, University of Pennsylvania · Pediatric Cardiology, Boston Children’s',
      bio: 'Cares for congenital heart conditions with a focus on long-term child wellness.',
      fees: 160,
      availability: {
        days: ['Monday', 'Thursday', 'Friday'],
        times: ['10:00', '11:00', '14:00', '15:00'],
      },
      gender: 'male',
      languages: ['English'],
    },
    {
      id: 'd9',
      name: 'Dr. Lisa Nguyen',
      specialty: 'Cosmetic & Restorative Dentist',
      departmentId: 'dental',
      experience: 9,
      rating: 4.8,
      reviews: 189,
      image: img('photo-1527613426441-4da17471b66d', 600),
      education: 'DDS, NYU College of Dentistry · Aesthetic Fellowship',
      bio: 'Creates natural-looking smiles with veneers, implants, and gentle restorative care.',
      fees: 95,
      availability: {
        days: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        times: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'],
      },
      gender: 'female',
      languages: ['English', 'Vietnamese'],
    },
    {
      id: 'd10',
      name: 'Dr. Andrew Brooks',
      specialty: 'Ophthalmologist',
      departmentId: 'ophthalmology',
      experience: 17,
      rating: 4.7,
      reviews: 143,
      image: img('photo-1607990283143-e81e7a2c9349', 600),
      education: 'MD, Duke · Cornea Fellowship, Bascom Palmer',
      bio: 'Expert in cataract and refractive surgery with thousands of successful procedures.',
      fees: 150,
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'],
        times: ['08:00', '09:00', '10:00', '11:00', '14:00'],
      },
      gender: 'male',
      languages: ['English'],
    },
    {
      id: 'd11',
      name: 'Dr. Sofia Alvarez',
      specialty: 'OB-GYN',
      departmentId: 'gynecology',
      experience: 12,
      rating: 4.9,
      reviews: 211,
      image: img('photo-1594824476967-48c8b964273f', 600),
      education: 'MD, Northwestern · Maternal-Fetal Medicine Training',
      bio: 'Supports women through pregnancy, fertility journeys, and gynecologic wellness.',
      fees: 140,
      availability: {
        days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        times: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'],
      },
      gender: 'female',
      languages: ['English', 'Spanish'],
    },
    {
      id: 'd12',
      name: 'Dr. Helen Park',
      specialty: 'Dermatologist',
      departmentId: 'dermatology',
      experience: 8,
      rating: 4.8,
      reviews: 176,
      image: img('photo-1559839734-2b71ea197ec2', 600),
      education: 'MD, University of Michigan · Dermatology Residency, NYU',
      bio: 'Combines medical dermatology with evidence-based cosmetic treatments.',
      fees: 130,
      availability: {
        days: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
        times: ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
      },
      gender: 'female',
      languages: ['English', 'Korean'],
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Treatments (8)                                                    */
  /* ------------------------------------------------------------------ */
  const treatments = [
    {
      id: 't1',
      name: 'Cardiac Stress Test',
      department: 'cardiology',
      description:
        'Monitored exercise or pharmacological stress test to evaluate heart function and blood flow.',
      price: 250,
      duration: '45–60 min',
      image: img('photo-1576091160550-2173dba999ef'),
    },
    {
      id: 't2',
      name: 'EEG / Brain Mapping',
      department: 'neurology',
      description:
        'Electroencephalogram recording to assess brain activity for seizures and neurological disorders.',
      price: 320,
      duration: '60–90 min',
      image: img('photo-1559757148-5c350d0d3c56'),
    },
    {
      id: 't3',
      name: 'Knee Arthroscopy',
      department: 'orthopedics',
      description:
        'Minimally invasive joint procedure for diagnosis and treatment of ligament and cartilage injuries.',
      price: 2800,
      duration: '1–2 hours',
      image: img('photo-1579684385127-1ef15d508118'),
    },
    {
      id: 't4',
      name: 'Well-Child Checkup',
      department: 'pediatrics',
      description:
        'Comprehensive pediatric wellness visit including growth tracking, vaccines, and developmental screening.',
      price: 90,
      duration: '30 min',
      image: img('photo-1631217868264-e5b90bb7e133'),
    },
    {
      id: 't5',
      name: 'Dental Cleaning & Exam',
      department: 'dental',
      description:
        'Professional scaling, polishing, oral exam, and personalized hygiene recommendations.',
      price: 85,
      duration: '45 min',
      image: img('photo-1606811841689-23dfddce3e95'),
    },
    {
      id: 't6',
      name: 'Cataract Evaluation',
      department: 'ophthalmology',
      description:
        'Full eye exam with lens assessment and surgical planning for cataract treatment.',
      price: 175,
      duration: '40 min',
      image: img('photo-1576091160399-112ba8d25d1d'),
    },
    {
      id: 't7',
      name: 'Prenatal Consultation',
      department: 'gynecology',
      description:
        'First-trimester or ongoing prenatal visit with ultrasound referral and care planning.',
      price: 150,
      duration: '45 min',
      image: img('photo-1581595220892-b24562acb1e4'),
    },
    {
      id: 't8',
      name: 'Skin Cancer Screening',
      department: 'dermatology',
      description:
        'Full-body mole mapping and dermoscopic evaluation for early detection of skin cancers.',
      price: 110,
      duration: '30 min',
      image: img('photo-1612349317150-e413f6a5b16d'),
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Blog posts (6)                                                    */
  /* ------------------------------------------------------------------ */
  const blogs = [
    {
      id: 'b1',
      title: '5 Heart-Healthy Habits You Can Start Today',
      excerpt:
        'Small daily choices — from walking after meals to managing stress — can dramatically improve cardiovascular health.',
      content: `<p>Your heart works around the clock. Supporting it doesn’t require a perfect lifestyle overnight — consistent, realistic habits matter most.</p>
<p><strong>1. Move for 30 minutes.</strong> Brisk walking, cycling, or swimming strengthens the heart muscle and improves circulation.</p>
<p><strong>2. Choose colorful plates.</strong> Fruits, vegetables, whole grains, and lean proteins reduce inflammation and cholesterol.</p>
<p><strong>3. Sleep 7–8 hours.</strong> Poor sleep is linked to hypertension and irregular heart rhythms.</p>
<p><strong>4. Know your numbers.</strong> Track blood pressure, cholesterol, and blood sugar with your physician.</p>
<p><strong>5. Manage stress.</strong> Breathing exercises, mindfulness, and social connection all protect heart health.</p>
<p>If you have chest pain, shortness of breath, or a family history of heart disease, schedule a cardiology consultation at MediCare Plus.</p>`,
      author: 'Dr. Sarah Mitchell',
      date: '2026-06-12',
      image: img('photo-1505751172876-fa1923c50140'),
      category: 'Cardiology',
      tags: ['heart', 'wellness', 'prevention'],
    },
    {
      id: 'b2',
      title: 'Understanding Migraines: Triggers and Relief',
      excerpt:
        'Migraines are more than headaches. Learn common triggers and when to seek neurological care.',
      content: `<p>Migraines can disrupt work, sleep, and family life. Identifying triggers is the first step toward lasting relief.</p>
<p>Common triggers include dehydration, skipped meals, bright screens, hormonal changes, and certain foods. Keeping a simple symptom diary helps your neurologist tailor treatment.</p>
<p>Modern options range from lifestyle changes and preventive medications to injectable therapies for chronic migraine. Don’t wait if headaches worsen or come with vision changes — early evaluation matters.</p>`,
      author: 'Dr. Priya Sharma',
      date: '2026-05-28',
      image: img('photo-1559757175-5700dde9bc39'),
      category: 'Neurology',
      tags: ['migraine', 'brain health', 'pain'],
    },
    {
      id: 'b3',
      title: 'Recovering After Joint Replacement Surgery',
      excerpt:
        'A practical timeline for walking, physical therapy, and returning to daily activities after hip or knee replacement.',
      content: `<p>Joint replacement can restore mobility and quality of life. Recovery works best as a partnership between you, your surgeon, and your rehab team.</p>
<p>Expect progressive walking goals in the first weeks, structured physical therapy, and gradual return to driving and work based on your procedure. Pain control, wound care, and fall prevention are essential.</p>
<p>Our Orthopedics team at MediCare Plus provides personalized recovery pathways for every patient.</p>`,
      author: 'Dr. Emily Watson',
      date: '2026-05-10',
      image: img('photo-1579684385127-1ef15d508118'),
      category: 'Orthopedics',
      tags: ['surgery', 'recovery', 'joints'],
    },
    {
      id: 'b4',
      title: 'Childhood Vaccines: What Parents Should Know',
      excerpt:
        'Clear answers on vaccine schedules, side effects, and how immunization protects communities.',
      content: `<p>Vaccines are one of the safest and most effective tools in pediatrics. They protect your child and the people around them who may be more vulnerable.</p>
<p>Mild fever or soreness after a shot is common and usually short-lived. Serious reactions are rare. Always discuss your child’s history with your pediatrician before appointments.</p>
<p>Bring your immunization card to every visit so we can keep your family’s records accurate and up to date.</p>`,
      author: 'Dr. Aisha Patel',
      date: '2026-04-22',
      image: img('photo-1631217868264-e5b90bb7e133'),
      category: 'Pediatrics',
      tags: ['vaccines', 'children', 'prevention'],
    },
    {
      id: 'b5',
      title: 'Protecting Your Eyes in a Screen-Heavy World',
      excerpt:
        'Simple habits to reduce digital eye strain and keep vision sharp at every age.',
      content: `<p>Hours of screen time can cause dryness, blurred vision, and headaches. The 20-20-20 rule helps: every 20 minutes, look 20 feet away for 20 seconds.</p>
<p>Also consider proper lighting, blue-light filters for night work, and annual comprehensive eye exams — especially after age 40 when cataracts and glaucoma risk rise.</p>`,
      author: 'Dr. Andrew Brooks',
      date: '2026-04-05',
      image: img('photo-1576091160399-112ba8d25d1d'),
      category: 'Ophthalmology',
      tags: ['vision', 'screens', 'eye care'],
    },
    {
      id: 'b6',
      title: 'Skin Care Essentials for Every Season',
      excerpt:
        'Dermatologist-approved tips for hydration, sun protection, and early detection of skin changes.',
      content: `<p>Healthy skin starts with daily sunscreen (SPF 30+), gentle cleansing, and moisturizing matched to your skin type.</p>
<p>Watch for new or changing moles. Early skin cancer detection saves lives. Book a screening if you notice asymmetry, irregular borders, color changes, or growth.</p>`,
      author: 'Dr. Helen Park',
      date: '2026-03-18',
      image: img('photo-1570172619644-dfd03ed5d881'),
      category: 'Dermatology',
      tags: ['skin', 'sunscreen', 'wellness'],
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Testimonials (6)                                                  */
  /* ------------------------------------------------------------------ */
  const testimonials = [
    {
      name: 'Rachel Green',
      role: 'Cardiology Patient',
      text: 'Dr. Mitchell and the cardio team saved my life after a scare. The care was fast, clear, and genuinely compassionate from admission to follow-up.',
      rating: 5,
      image: img('photo-1494790108377-be9c29b29330', 200),
    },
    {
      name: 'Marcus Johnson',
      role: 'Orthopedics Patient',
      text: 'After my knee replacement I was walking within days. Physical therapy coordination at MediCare Plus made recovery feel manageable.',
      rating: 5,
      image: img('photo-1507003211169-0a1dd7228f2d', 200),
    },
    {
      name: 'Anita Desai',
      role: 'Parent of Pediatric Patient',
      text: 'Dr. Patel puts kids at ease instantly. Our daughter actually looks forward to checkups — that says everything.',
      rating: 5,
      image: img('photo-1438761681033-6461ffad8d80', 200),
    },
    {
      name: 'Tom Bradley',
      role: 'Neurology Patient',
      text: 'Finally got answers for my chronic migraines. The neurology team listened carefully and built a plan that actually works.',
      rating: 4,
      image: img('photo-1472099645785-5658abf4ff4e', 200),
    },
    {
      name: 'Sofia Martins',
      role: 'Dental Patient',
      text: 'Beautiful clinic, gentle dentists, and zero judgment about my dental anxiety. Best cleaning I’ve ever had.',
      rating: 5,
      image: img('photo-1544005313-94ddf0286df2', 200),
    },
    {
      name: 'Kenichi Sato',
      role: 'Ophthalmology Patient',
      text: 'Cataract surgery was smooth and the staff explained every step. My vision is clearer than it’s been in years.',
      rating: 5,
      image: img('photo-1500648767791-00dcc994a43e', 200),
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Gallery (12)                                                      */
  /* ------------------------------------------------------------------ */
  const gallery = [
    { id: 'g1', title: 'Main Hospital Entrance', category: 'Facility', image: img('photo-1519494026892-80bbd2d6fd0d', 1000) },
    { id: 'g2', title: 'Modern Operating Theater', category: 'Surgery', image: img('photo-1551076805-e1869033e561', 1000) },
    { id: 'g3', title: 'Cardiology Suite', category: 'Departments', image: img('photo-1628348068343-c6a848dcebbc', 1000) },
    { id: 'g4', title: 'Pediatric Wing', category: 'Departments', image: img('photo-1631217868264-e5b90bb7e133', 1000) },
    { id: 'g5', title: 'Diagnostic Imaging Lab', category: 'Technology', image: img('photo-1516549655169-df83a0774514', 1000) },
    { id: 'g6', title: 'Patient Recovery Room', category: 'Facility', image: img('photo-1586773860418-d37222d8fce3', 1000) },
    { id: 'g7', title: 'Dental Clinic', category: 'Departments', image: img('photo-1606811841689-23dfddce3e95', 1000) },
    { id: 'g8', title: 'Emergency Response Team', category: 'Emergency', image: img('photo-1582719471384-894fbb16e074', 1000) },
    { id: 'g9', title: 'Pharmacy Counter', category: 'Facility', image: img('photo-1587854691252-dc440b2234b7', 1000) },
    { id: 'g10', title: 'Rehabilitation Gym', category: 'Therapy', image: img('photo-1571019614242-c5c5dee9f50b', 1000) },
    { id: 'g11', title: 'Maternity Ward', category: 'Departments', image: img('photo-1581595220892-b24562acb1e4', 1000) },
    { id: 'g12', title: 'Hospital Courtyard Garden', category: 'Facility', image: img('photo-1587351021759-3e566b6af7ce', 1000) },
  ];

  /* ------------------------------------------------------------------ */
  /*  Pricing plans (3)                                                 */
  /* ------------------------------------------------------------------ */
  const pricing = [
    {
      id: 'basic',
      name: 'Basic Checkup',
      price: 99,
      period: 'visit',
      popular: false,
      description: 'Ideal for annual wellness visits and essential screenings.',
      features: [
        'General physician consultation',
        'Basic blood panel',
        'BMI & vitals check',
        'Digital health report',
        'Email follow-up tips',
      ],
    },
    {
      id: 'family',
      name: 'Family Care',
      price: 299,
      period: 'month',
      popular: true,
      description: 'Coverage-style package for families of up to four members.',
      features: [
        'Up to 4 family members',
        'Priority appointment booking',
        'Annual full-body checkup',
        'Dental cleaning (2/year)',
        '24/7 nurse helpline',
        '10% off specialist fees',
      ],
    },
    {
      id: 'premium',
      name: 'Premium Health',
      price: 599,
      period: 'month',
      popular: false,
      description: 'Comprehensive concierge care with advanced diagnostics.',
      features: [
        'Everything in Family Care',
        'Dedicated care coordinator',
        'Advanced imaging discounts',
        'Home sample collection',
        'Specialist second opinions',
        'Emergency room priority',
        'Mental wellness sessions',
      ],
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  FAQs (8)                                                          */
  /* ------------------------------------------------------------------ */
  const faqs = [
    {
      id: 'faq1',
      question: 'How do I book an appointment online?',
      answer:
        'Use the Book Appointment page, choose a department and doctor, pick an available date and time slot, then submit. You’ll receive a confirmation in your patient dashboard. Demo accounts work fully offline via localStorage.',
    },
    {
      id: 'faq2',
      question: 'What should I bring to my first visit?',
      answer:
        'Please bring a photo ID, insurance card (if any), list of current medications, and previous medical reports or imaging. Arrive 15 minutes early to complete registration.',
    },
    {
      id: 'faq3',
      question: 'Do you accept emergency patients 24/7?',
      answer:
        'Yes. Our Emergency Department is open 24/7. Call 108 / +1-800-911-HELP for immediate assistance or go directly to the ER entrance on Healing Way.',
    },
    {
      id: 'faq4',
      question: 'Can I cancel or reschedule an appointment?',
      answer:
        'Yes. Log into your patient panel, open My Appointments, and cancel or request a new slot. Please cancel at least 24 hours in advance when possible.',
    },
    {
      id: 'faq5',
      question: 'Are telehealth consultations available?',
      answer:
        'Selected departments offer video consultations. Look for the Telehealth badge on eligible doctors when booking, or ask our support team.',
    },
    {
      id: 'faq6',
      question: 'How are doctor consultation fees calculated?',
      answer:
        'Each specialist lists a base consultation fee. Procedures and diagnostics are billed separately. Package plans (Basic, Family, Premium) can reduce out-of-pocket costs.',
    },
    {
      id: 'faq7',
      question: 'Is my medical data secure on this demo site?',
      answer:
        'This demo stores data only in your browser’s localStorage — nothing is sent to a real server. For production, MediCare Plus would use encrypted, HIPAA-aligned systems.',
    },
    {
      id: 'faq8',
      question: 'How do I reset my password?',
      answer:
        'On the login page, click Forgot Password, enter your email, and use the simulated reset token shown in the toast/alert. Demo users can reset offline.',
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Medicines (admin sample)                                          */
  /* ------------------------------------------------------------------ */
  const medicines = [
    { id: 'm1', name: 'Atorvastatin 20mg', category: 'Cardiac', stock: 240, price: 12.5, unit: 'strip', manufacturer: 'HeartCare Labs' },
    { id: 'm2', name: 'Metformin 500mg', category: 'Diabetes', stock: 500, price: 6.0, unit: 'strip', manufacturer: 'GlucoMed' },
    { id: 'm3', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 180, price: 8.75, unit: 'strip', manufacturer: 'BioPharm' },
    { id: 'm4', name: 'Ibuprofen 400mg', category: 'Pain Relief', stock: 320, price: 4.25, unit: 'strip', manufacturer: 'ReliefCo' },
    { id: 'm5', name: 'Omeprazole 20mg', category: 'Gastro', stock: 210, price: 7.5, unit: 'strip', manufacturer: 'DigestAid' },
    { id: 'm6', name: 'Cetirizine 10mg', category: 'Allergy', stock: 400, price: 3.5, unit: 'strip', manufacturer: 'AllergyFree' },
    { id: 'm7', name: 'Amlodipine 5mg', category: 'Cardiac', stock: 275, price: 5.0, unit: 'strip', manufacturer: 'HeartCare Labs' },
    { id: 'm8', name: 'Salbutamol Inhaler', category: 'Respiratory', stock: 95, price: 18.0, unit: 'unit', manufacturer: 'BreathEasy' },
    { id: 'm9', name: 'Vitamin D3 60K', category: 'Supplement', stock: 150, price: 9.0, unit: 'pack', manufacturer: 'VitaPlus' },
    { id: 'm10', name: 'Paracetamol 650mg', category: 'Pain Relief', stock: 600, price: 2.5, unit: 'strip', manufacturer: 'ReliefCo' },
  ];

  /* ------------------------------------------------------------------ */
  /*  Sample appointments & patients (dashboards)                       */
  /* ------------------------------------------------------------------ */
  const sampleAppointments = [
    {
      id: 'apt-1001',
      patientId: 'u-patient',
      patientName: 'Demo Patient',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Mitchell',
      departmentId: 'cardiology',
      departmentName: 'Cardiology',
      date: '2026-07-22',
      time: '10:00',
      reason: 'Chest discomfort follow-up',
      status: 'pending',
      createdAt: '2026-07-18T09:00:00.000Z',
    },
    {
      id: 'apt-1002',
      patientId: 'u-patient',
      patientName: 'Demo Patient',
      doctorId: 'd7',
      doctorName: 'Dr. Aisha Patel',
      departmentId: 'pediatrics',
      departmentName: 'Pediatrics',
      date: '2026-07-15',
      time: '11:00',
      reason: 'Child wellness checkup',
      status: 'approved',
      createdAt: '2026-07-10T14:20:00.000Z',
    },
    {
      id: 'apt-1003',
      patientId: 'u-p2',
      patientName: 'Rachel Green',
      doctorId: 'd3',
      doctorName: 'Dr. Priya Sharma',
      departmentId: 'neurology',
      departmentName: 'Neurology',
      date: '2026-07-12',
      time: '14:00',
      reason: 'Migraine evaluation',
      status: 'completed',
      createdAt: '2026-07-05T11:00:00.000Z',
    },
    {
      id: 'apt-1004',
      patientId: 'u-p3',
      patientName: 'Marcus Johnson',
      doctorId: 'd5',
      doctorName: 'Dr. Emily Watson',
      departmentId: 'orthopedics',
      departmentName: 'Orthopedics',
      date: '2026-07-08',
      time: '09:00',
      reason: 'Knee pain assessment',
      status: 'cancelled',
      createdAt: '2026-07-01T08:30:00.000Z',
    },
    {
      id: 'apt-1005',
      patientId: 'u-p4',
      patientName: 'Anita Desai',
      doctorId: 'd11',
      doctorName: 'Dr. Sofia Alvarez',
      departmentId: 'gynecology',
      departmentName: 'Gynecology',
      date: '2026-07-25',
      time: '15:00',
      reason: 'Prenatal consultation',
      status: 'pending',
      createdAt: '2026-07-19T16:45:00.000Z',
    },
    {
      id: 'apt-1006',
      patientId: 'u-patient',
      patientName: 'Demo Patient',
      doctorId: 'd5',
      doctorName: 'Dr. Emily Watson',
      departmentId: 'orthopedics',
      departmentName: 'Orthopedics',
      date: '2026-08-02',
      time: '09:00',
      reason: 'Follow-up on physiotherapy progress',
      status: 'approved',
      createdAt: '2026-07-16T10:15:00.000Z',
    },
    {
      id: 'apt-1007',
      patientId: 'u-patient',
      patientName: 'Demo Patient',
      doctorId: 'd9',
      doctorName: 'Dr. Lisa Nguyen',
      departmentId: 'dental',
      departmentName: 'Dental',
      date: '2026-06-10',
      time: '11:00',
      reason: 'Routine dental cleaning',
      status: 'completed',
      createdAt: '2026-06-01T09:00:00.000Z',
    },
    {
      id: 'apt-1008',
      patientId: 'u-patient',
      patientName: 'Demo Patient',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Mitchell',
      departmentId: 'cardiology',
      departmentName: 'Cardiology',
      date: '2026-05-02',
      time: '10:00',
      reason: 'Annual cardiac checkup',
      status: 'completed',
      createdAt: '2026-04-20T08:30:00.000Z',
    },
    {
      id: 'apt-1009',
      patientId: 'u-patient',
      patientName: 'Demo Patient',
      doctorId: 'd3',
      doctorName: 'Dr. Priya Sharma',
      departmentId: 'neurology',
      departmentName: 'Neurology',
      date: '2026-04-18',
      time: '15:00',
      reason: 'Migraine follow-up',
      status: 'cancelled',
      createdAt: '2026-04-10T13:00:00.000Z',
    },
  ];

  const samplePatients = [
    {
      id: 'u-patient',
      name: 'Demo Patient',
      email: 'patient@medicare.com',
      phone: '+1 555-0101',
      age: 34,
      gender: 'female',
      bloodGroup: 'O+',
      address: '42 Oak Street, Health City',
      lastVisit: '2026-07-15',
      status: 'active',
    },
    {
      id: 'u-p2',
      name: 'Rachel Green',
      email: 'rachel.g@email.com',
      phone: '+1 555-0102',
      age: 41,
      gender: 'female',
      bloodGroup: 'A+',
      address: '18 Maple Ave, Health City',
      lastVisit: '2026-07-12',
      status: 'active',
    },
    {
      id: 'u-p3',
      name: 'Marcus Johnson',
      email: 'marcus.j@email.com',
      phone: '+1 555-0103',
      age: 52,
      gender: 'male',
      bloodGroup: 'B+',
      address: '7 River Road, Health City',
      lastVisit: '2026-06-28',
      status: 'active',
    },
    {
      id: 'u-p4',
      name: 'Anita Desai',
      email: 'anita.d@email.com',
      phone: '+1 555-0104',
      age: 29,
      gender: 'female',
      bloodGroup: 'AB+',
      address: '90 Cedar Lane, Health City',
      lastVisit: '2026-07-01',
      status: 'active',
    },
    {
      id: 'u-p5',
      name: 'Tom Bradley',
      email: 'tom.b@email.com',
      phone: '+1 555-0105',
      age: 47,
      gender: 'male',
      bloodGroup: 'O-',
      address: '3 Hill Crest, Health City',
      lastVisit: '2026-05-20',
      status: 'inactive',
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Time slots                                                        */
  /* ------------------------------------------------------------------ */
  const timeSlots = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
  ];

  /* ------------------------------------------------------------------ */
  /*  Helper lookups & filters                                          */
  /* ------------------------------------------------------------------ */
  function getDoctor(id) {
    return doctors.find((d) => d.id === id) || null;
  }

  function getDepartment(id) {
    return departments.find((d) => d.id === id) || null;
  }

  function getTreatment(id) {
    return treatments.find((t) => t.id === id) || null;
  }

  function getBlog(id) {
    return blogs.find((b) => b.id === id) || null;
  }

  function getMedicine(id) {
    return medicines.find((m) => m.id === id) || null;
  }

  /**
   * Filter doctors by department and/or free-text search.
   * @param {{ dept?: string, search?: string, minRating?: number }} opts
   */
  function filterDoctors(opts = {}) {
    const dept = (opts.dept || opts.departmentId || '').toLowerCase();
    const search = (opts.search || '').trim().toLowerCase();
    const minRating = opts.minRating != null ? Number(opts.minRating) : null;

    return doctors.filter((doc) => {
      if (dept && doc.departmentId !== dept) return false;
      if (minRating != null && doc.rating < minRating) return false;
      if (search) {
        const hay = [
          doc.name,
          doc.specialty,
          doc.bio,
          doc.education,
          getDepartment(doc.departmentId)?.name || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  /**
   * Filter treatments by department and/or search text.
   */
  function filterTreatments(opts = {}) {
    const dept = (opts.dept || opts.department || '').toLowerCase();
    const search = (opts.search || '').trim().toLowerCase();

    return treatments.filter((t) => {
      if (dept && t.department !== dept) return false;
      if (search) {
        const hay = [t.name, t.description, t.department].join(' ').toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  /**
   * Filter blogs by category, tag, or search.
   */
  function filterBlogs(opts = {}) {
    const category = (opts.category || '').toLowerCase();
    const tag = (opts.tag || '').toLowerCase();
    const search = (opts.search || '').trim().toLowerCase();

    return blogs.filter((b) => {
      if (category && b.category.toLowerCase() !== category) return false;
      if (tag && !(b.tags || []).some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const hay = [b.title, b.excerpt, b.content, b.author, b.category, ...(b.tags || [])]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  /**
   * Filter gallery items by category.
   */
  function filterGallery(category) {
    if (!category || category === 'all') return gallery.slice();
    const c = category.toLowerCase();
    return gallery.filter((g) => g.category.toLowerCase() === c);
  }

  /**
   * Doctors belonging to a department, with department name attached.
   */
  function getDoctorsByDepartment(departmentId) {
    return filterDoctors({ dept: departmentId }).map((d) => ({
      ...d,
      departmentName: getDepartment(d.departmentId)?.name || '',
    }));
  }

  /**
   * Enrich a doctor with department metadata.
   */
  function enrichDoctor(doctor) {
    if (!doctor) return null;
    const dept = getDepartment(doctor.departmentId);
    return {
      ...doctor,
      departmentName: dept?.name || '',
      departmentIcon: dept?.icon || '',
    };
  }

  /**
   * Search across doctors, departments, treatments, and blogs.
   */
  function globalSearch(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      return { doctors: [], departments: [], treatments: [], blogs: [] };
    }
    return {
      doctors: filterDoctors({ search: q }),
      departments: departments.filter((d) =>
        [d.name, d.description].join(' ').toLowerCase().includes(q)
      ),
      treatments: filterTreatments({ search: q }),
      blogs: filterBlogs({ search: q }),
    };
  }

  /**
   * Day name for a Date or YYYY-MM-DD string (local).
   */
  function getDayName(dateInput) {
    const d = typeof dateInput === 'string' ? new Date(dateInput + 'T12:00:00') : new Date(dateInput);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  /**
   * Available time slots for a doctor on a given date.
   * Intersects doctor.availability.times with global timeSlots when possible.
   */
  function getAvailableSlots(doctorId, dateStr) {
    const doctor = getDoctor(doctorId);
    if (!doctor) return [];

    const dayName = getDayName(dateStr);
    if (!doctor.availability.days.includes(dayName)) return [];

    const doctorTimes = doctor.availability.times || [];
    // Prefer intersection with global timeSlots; fall back to doctor's own list
    const intersection = timeSlots.filter((slot) => doctorTimes.includes(slot));
    return intersection.length ? intersection : doctorTimes.slice();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                        */
  /* ------------------------------------------------------------------ */
  const MediCareData = {
    hospital,
    departments,
    doctors,
    treatments,
    blogs,
    testimonials,
    gallery,
    pricing,
    faqs,
    medicines,
    sampleAppointments,
    samplePatients,
    timeSlots,
    // helpers
    getDoctor,
    getDepartment,
    getTreatment,
    getBlog,
    getMedicine,
    filterDoctors,
    filterTreatments,
    filterBlogs,
    filterGallery,
    getDoctorsByDepartment,
    enrichDoctor,
    globalSearch,
    getDayName,
    getAvailableSlots,
  };

  // Browser global
  global.MediCareData = MediCareData;

  // CommonJS / bundler friendly
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareData;
  }
})(typeof window !== 'undefined' ? window : globalThis);
