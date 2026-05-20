export type ApplicationStatus = "applied" | "interviewing" | "rejected" | "hired";

export interface EmailRecord {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  direction: "incoming" | "outgoing";
}

export interface InterviewRecord {
  id: string;
  title: string;
  scheduledAt: string;
  durationMins: number;
  type: "phone" | "video" | "onsite" | "assessment";
  location?: string;
  isReminded: boolean;
}

export interface Application {
  id: string;
  company: string;
  jobTitle: string;
  location: string;
  status: ApplicationStatus;
  appliedAt: string;
  source: string;
  salary?: string;
  logoColor: string;
  emails: EmailRecord[];
  interviews: InterviewRecord[];
  notes?: string;
  lastActivityAt: string;
}

const now = new Date();
const d = (offsetDays: number, hours = 9) => {
  const x = new Date(now);
  x.setDate(x.getDate() + offsetDays);
  x.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
  return x.toISOString();
};

export const applications: Application[] = [
  {
    id: "a-001",
    company: "Linear",
    jobTitle: "Senior Product Engineer",
    location: "Remote, EU",
    status: "interviewing",
    appliedAt: d(-21),
    lastActivityAt: d(-1, 14),
    source: "Referral — Karri Saarinen",
    salary: "€110k–€140k",
    logoColor: "#5E6AD2",
    emails: [
      {
        id: "e-1",
        sender: "Karri Saarinen",
        senderEmail: "karri@linear.app",
        subject: "Re: Application for Senior Product Engineer",
        snippet: "Great to hear from you! I'd love to set up a call next week to discuss the role in more depth. Are you free Tuesday or Wednesday afternoon?",
        receivedAt: d(-18, 15),
        direction: "incoming",
      },
      {
        id: "e-2",
        sender: "Mulya Salam",
        senderEmail: "mulyasalam48@gmail.com",
        subject: "Re: Application for Senior Product Engineer",
        snippet: "Tuesday at 3pm CET works perfectly. Looking forward to it.",
        receivedAt: d(-17, 9),
        direction: "outgoing",
      },
      {
        id: "e-3",
        sender: "Linear Hiring",
        senderEmail: "hiring@linear.app",
        subject: "Next Steps — Technical Round",
        snippet: "Following up on your conversation with Karri. We'd like to invite you to a technical interview focused on systems design and React fundamentals.",
        receivedAt: d(-3, 11),
        direction: "incoming",
      },
    ],
    interviews: [
      {
        id: "i-1",
        title: "Intro Call — Karri Saarinen",
        scheduledAt: d(-15, 15),
        durationMins: 30,
        type: "video",
        location: "Google Meet",
        isReminded: true,
      },
      {
        id: "i-2",
        title: "Technical Round — Systems & React",
        scheduledAt: d(2, 14),
        durationMins: 90,
        type: "video",
        location: "Linear HQ Zoom",
        isReminded: false,
      },
    ],
    notes: "Strong fit. Karri mentioned the team is small and ships weekly. Prep: read their public engineering blog & systems design.",
  },
  {
    id: "a-002",
    company: "Vercel",
    jobTitle: "Frontend Engineer, Platform",
    location: "Remote",
    status: "interviewing",
    appliedAt: d(-14),
    lastActivityAt: d(-2, 10),
    source: "Company website",
    salary: "$140k–$180k + equity",
    logoColor: "#000000",
    emails: [
      {
        id: "e-4",
        sender: "Vercel Recruiting",
        senderEmail: "talent@vercel.com",
        subject: "Application received — Frontend Engineer",
        snippet: "Thanks for applying! We're reviewing applications and will be in touch within 7 business days.",
        receivedAt: d(-13, 8),
        direction: "incoming",
      },
      {
        id: "e-5",
        sender: "Sarah Drasner",
        senderEmail: "sarah@vercel.com",
        subject: "Phone screen scheduling",
        snippet: "I'd love to chat about your work on Next.js performance optimization. When works for you next week?",
        receivedAt: d(-7, 16),
        direction: "incoming",
      },
    ],
    interviews: [
      {
        id: "i-3",
        title: "Phone Screen — Sarah Drasner",
        scheduledAt: d(0, 17),
        durationMins: 45,
        type: "phone",
        isReminded: false,
      },
    ],
  },
  {
    id: "a-003",
    company: "Figma",
    jobTitle: "Product Designer, Tools",
    location: "San Francisco / Remote",
    status: "applied",
    appliedAt: d(-5),
    lastActivityAt: d(-5, 10),
    source: "LinkedIn",
    salary: "$160k–$210k",
    logoColor: "#A259FF",
    emails: [
      {
        id: "e-6",
        sender: "Figma Careers",
        senderEmail: "careers@figma.com",
        subject: "We received your application",
        snippet: "Thanks for your interest in Figma. Our recruiting team will review your application and reach out if there's a match.",
        receivedAt: d(-5, 10),
        direction: "incoming",
      },
    ],
    interviews: [],
  },
  {
    id: "a-004",
    company: "Stripe",
    jobTitle: "Software Engineer, Payments",
    location: "Dublin",
    status: "applied",
    appliedAt: d(-3),
    lastActivityAt: d(-3, 9),
    source: "Direct application",
    salary: "€95k–€120k",
    logoColor: "#635BFF",
    emails: [
      {
        id: "e-7",
        sender: "Stripe Recruiting",
        senderEmail: "no-reply@stripe.com",
        subject: "Your application to Stripe",
        snippet: "We have received your application for Software Engineer, Payments. Please allow 2 weeks for an initial review.",
        receivedAt: d(-3, 9),
        direction: "incoming",
      },
    ],
    interviews: [],
  },
  {
    id: "a-005",
    company: "Notion",
    jobTitle: "Engineering Manager",
    location: "Remote",
    status: "rejected",
    appliedAt: d(-32),
    lastActivityAt: d(-12, 11),
    source: "Referral",
    logoColor: "#000000",
    emails: [
      {
        id: "e-8",
        sender: "Notion People",
        senderEmail: "people@notion.so",
        subject: "Update on your application",
        snippet: "Thank you for your time and interest. After careful consideration, we've decided to move forward with other candidates whose experience more closely aligns.",
        receivedAt: d(-12, 11),
        direction: "incoming",
      },
    ],
    interviews: [
      {
        id: "i-4",
        title: "Hiring Manager Interview",
        scheduledAt: d(-20, 14),
        durationMins: 60,
        type: "video",
        isReminded: true,
      },
    ],
  },
  {
    id: "a-006",
    company: "Anthropic",
    jobTitle: "Research Engineer",
    location: "San Francisco",
    status: "interviewing",
    appliedAt: d(-25),
    lastActivityAt: d(0, 8),
    source: "Referral",
    salary: "$220k–$300k",
    logoColor: "#D97757",
    emails: [
      {
        id: "e-9",
        sender: "Anthropic Recruiting",
        senderEmail: "recruiting@anthropic.com",
        subject: "Onsite invitation — Research Engineer",
        snippet: "Congratulations on advancing to the final round. We'd like to invite you to an onsite interview at our SF office. Please find available dates below.",
        receivedAt: d(0, 8),
        direction: "incoming",
      },
    ],
    interviews: [
      {
        id: "i-5",
        title: "Final Onsite — 5 rounds",
        scheduledAt: d(7, 9),
        durationMins: 360,
        type: "onsite",
        location: "Anthropic SF — 548 Market St",
        isReminded: false,
      },
    ],
    notes: "VERY important. Prep: distributed training, RLHF papers, system design.",
  },
  {
    id: "a-007",
    company: "Supabase",
    jobTitle: "Developer Advocate",
    location: "Remote",
    status: "hired",
    appliedAt: d(-60),
    lastActivityAt: d(-7, 16),
    source: "Twitter DM",
    salary: "€90k + equity",
    logoColor: "#3ECF8E",
    emails: [
      {
        id: "e-10",
        sender: "Paul Copplestone",
        senderEmail: "paul@supabase.io",
        subject: "Welcome to Supabase!",
        snippet: "We're so excited to have you. Offer letter attached — please review and let us know when you'd like to start.",
        receivedAt: d(-7, 16),
        direction: "incoming",
      },
    ],
    interviews: [],
    notes: "Offer accepted. Start date: TBD.",
  },
  {
    id: "a-008",
    company: "Cloudflare",
    jobTitle: "Systems Engineer",
    location: "Lisbon",
    status: "rejected",
    appliedAt: d(-45),
    lastActivityAt: d(-30, 10),
    source: "LinkedIn",
    logoColor: "#F38020",
    emails: [
      {
        id: "e-11",
        sender: "Cloudflare Talent",
        senderEmail: "talent@cloudflare.com",
        subject: "Update on your application",
        snippet: "After review, we will not be moving forward at this time. We encourage you to apply again in the future.",
        receivedAt: d(-30, 10),
        direction: "incoming",
      },
    ],
    interviews: [],
  },
  {
    id: "a-009",
    company: "Raycast",
    jobTitle: "macOS Engineer",
    location: "Remote",
    status: "applied",
    appliedAt: d(-8),
    lastActivityAt: d(-8, 9),
    source: "Newsletter",
    salary: "€100k–€130k",
    logoColor: "#FF6363",
    emails: [
      {
        id: "e-12",
        sender: "Raycast",
        senderEmail: "jobs@raycast.com",
        subject: "Application received",
        snippet: "Hey! Thanks for applying. Our team reviews every application personally — give us a week or so.",
        receivedAt: d(-8, 9),
        direction: "incoming",
      },
    ],
    interviews: [],
  },
  {
    id: "a-010",
    company: "Replicate",
    jobTitle: "Full-stack Engineer",
    location: "Remote",
    status: "interviewing",
    appliedAt: d(-10),
    lastActivityAt: d(-4, 13),
    source: "Hacker News",
    salary: "$160k–$200k",
    logoColor: "#000000",
    emails: [
      {
        id: "e-13",
        sender: "Ben Firshman",
        senderEmail: "ben@replicate.com",
        subject: "Loved your portfolio",
        snippet: "Your work on streaming UI inference is exactly what we need. Can we chat this week?",
        receivedAt: d(-4, 13),
        direction: "incoming",
      },
    ],
    interviews: [
      {
        id: "i-6",
        title: "Founders Chat — Ben & Andreas",
        scheduledAt: d(3, 16),
        durationMins: 45,
        type: "video",
        isReminded: false,
      },
    ],
  },
  {
    id: "a-011",
    company: "Arc / The Browser Company",
    jobTitle: "Senior Designer",
    location: "New York",
    status: "applied",
    appliedAt: d(-1),
    lastActivityAt: d(-1, 11),
    source: "Direct",
    logoColor: "#FF4D00",
    emails: [],
    interviews: [],
  },
];

export const statusColumns: { key: ApplicationStatus; label: string; subtitle: string }[] = [
  { key: "applied", label: "Submitted", subtitle: "Awaiting reply" },
  { key: "interviewing", label: "In Process", subtitle: "Conversations underway" },
  { key: "hired", label: "Offered", subtitle: "Decisions to make" },
  { key: "rejected", label: "Closed", subtitle: "Lessons archived" },
];

export const currentUser = {
  name: "Mulya Salam",
  email: "mulyasalam48@gmail.com",
  joinedAt: "2026-02-04",
  totalApplications: applications.length,
};
