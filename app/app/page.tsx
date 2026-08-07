const ministries = [
  {
    title: "Prayer & Intercession",
    description: "Dedicated seasons of prayer, healing, and spiritual breakthrough.",
  },
  {
    title: "Discipleship",
    description: "Biblical teaching that equips believers to walk in purpose and power.",
  },
  {
    title: "Outreach & Service",
    description: "Serving communities with compassion, generosity, and kingdom love.",
  },
];

const events = [
  {
    title: "Midweek Prayer Gathering",
    detail: "Wednesdays · 7:00 PM · Online & In Person",
  },
  {
    title: "Women of Valor Retreat",
    detail: "September 14 · 10:00 AM · The Harbor House",
  },
  {
    title: "Kingdom Leadership Forum",
    detail: "October 5 · 6:30 PM · Community Hall",
  },
];

const books = [
  {
    title: "Seek My Face",
    description: "A devotional journey into intimacy, worship, and spiritual hunger.",
    status: "Available",
  },
  {
    title: "Spirit Forged Arsenal",
    description: "A powerful resource for spiritual warfare, resilience, and holy boldness.",
    status: "Coming Soon",
  },
];

const faithPoints = [
  "We believe the Bible is the inspired and infallible Word of God.",
  "We believe in the Trinity: Father, Son, and Holy Spirit.",
  "We believe salvation is by grace through faith in Jesus Christ.",
  "We believe in the power of prayer, healing, and the Holy Spirit's work today.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#fcfbf5_0%,_#f7efd4_45%,_#fffdf8_100%)] text-[#0B1F3A]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <a href="#home" className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0B1F3A] sm:text-base">
          Crowned Victors
        </a>
        <nav className="hidden gap-6 text-sm font-medium text-[#0B1F3A]/80 md:flex">
          <a href="#about" className="transition hover:text-[#D4AF37]">
            About
          </a>
          <a href="#vision" className="transition hover:text-[#D4AF37]">
            Vision
          </a>
          <a href="#ministries" className="transition hover:text-[#D4AF37]">
            Ministries
          </a>
          <a href="#contact" className="transition hover:text-[#D4AF37]">
            Contact
          </a>
        </nav>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 sm:px-6 lg:px-8 lg:gap-8 lg:pb-24">
        <section
          id="home"
          className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/40 bg-[#0B1F3A] p-8 text-white shadow-[0_35px_100px_-35px_rgba(11,31,58,0.9)] sm:p-10 lg:p-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.22),_transparent_30%)]" />
          <div className="absolute right-[-6rem] top-[-4rem] h-40 w-40 rounded-full border border-[#D4AF37]/30" />
          <div className="absolute bottom-0 left-[-4rem] h-28 w-28 rounded-full border border-[#D4AF37]/20" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                Crowned Victors Ministry
              </span>
              <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Crowned Victors
              </h1>
              <p className="mt-4 text-xl leading-8 text-white/85 sm:text-2xl">
                Equipping the saints to walk in bold faith, spiritual authority, and kingdom purpose.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-base font-semibold text-[#0B1F3A] transition hover:bg-[#e0bf4a]"
                >
                  Learn More
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
                >
                  Give Online
                </a>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                Our calling
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Raising a people who live in victory, not fear.
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-white/80 sm:text-base">
                <li>• Prayer-centered worship and spiritual renewal</li>
                <li>• Kingdom discipleship for every generation</li>
                <li>• A strong culture of service, compassion, and impact</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#D4AF37]/30 bg-[#0B1F3A] px-6 py-5 text-center text-white shadow-sm sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Scripture
          </p>
          <p className="mt-2 text-lg font-semibold sm:text-2xl">
            “And I saw, and behold a white horse...” — Revelation 6:2
          </p>
        </section>

        <section id="about" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-[0_20px_70px_-30px_rgba(11,31,58,0.25)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              About
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">
              A ministry rooted in grace, truth, and transformation.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#0B1F3A]/80">
              Crowned Victors Ministry exists to help believers discover their identity in Christ, grow in spiritual maturity, and live with courage, compassion, and kingdom clarity.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#0B1F3A] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Why We Serve
            </p>
            <div className="mt-4 space-y-4 text-base leading-8 text-white/80">
              <p>
                We create space for prayer, worship, discipleship, and community so people can experience lasting renewal and purposeful devotion.
              </p>
              <p>
                Every gathering is designed to strengthen believers and prepare them to impact homes, churches, and cities with hope.
              </p>
            </div>
          </div>
        </section>

        <section id="vision" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#fffdf8] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Vision</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#0B1F3A]">
              To raise a generation of crowned victors who shine with the glory of God.
            </h3>
            <p className="mt-4 text-lg leading-8 text-[#0B1F3A]/75">
              We envision churches, homes, and communities filled with believers who walk in holiness, wisdom, and spiritual authority.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Mission</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#0B1F3A]">
              To equip the saints through prayer, teaching, worship, and service.
            </h3>
            <p className="mt-4 text-lg leading-8 text-[#0B1F3A]/75">
              Our mission is to strengthen believers in their daily walk so they can stand firm, lead with integrity, and serve with love.
            </p>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
            Statement of Faith
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faithPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-[#D4AF37]/20 bg-[#fffdf8] p-4 text-[#0B1F3A]/80">
                {point}
              </div>
            ))}
          </div>
        </section>

        <section id="ministries" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#0B1F3A] p-8 text-white shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Ministries</p>
              <h3 className="mt-2 text-3xl font-semibold">Cultivating spiritual growth and kingdom impact.</h3>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ministries.map((ministry) => (
              <div key={ministry.title} className="rounded-[1.25rem] border border-white/10 bg-white/10 p-6">
                <h4 className="text-xl font-semibold text-white">{ministry.title}</h4>
                <p className="mt-3 text-base leading-8 text-white/75">{ministry.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="events" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Events</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {events.map((event) => (
              <div key={event.title} className="rounded-[1.25rem] border border-[#D4AF37]/20 bg-[#fffdf8] p-5">
                <h4 className="text-xl font-semibold text-[#0B1F3A]">{event.title}</h4>
                <p className="mt-2 text-base leading-7 text-[#0B1F3A]/75">{event.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="store" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#fffdf8] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Book Store</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {books.map((book) => (
              <div key={book.title} className="rounded-[1.25rem] border border-[#D4AF37]/20 bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xl font-semibold text-[#0B1F3A]">{book.title}</h4>
                  <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-sm font-semibold text-[#0B1F3A]">
                    {book.status}
                  </span>
                </div>
                <p className="mt-3 text-base leading-8 text-[#0B1F3A]/75">{book.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#0B1F3A] p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Contact</p>
              <h3 className="mt-3 text-3xl font-semibold">Let’s connect and grow together.</h3>
              <p className="mt-4 text-lg leading-8 text-white/80">
                Whether you are seeking prayer, partnership, or a deeper walk with God, we would love to hear from you.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Reach us</p>
              <div className="mt-4 space-y-3 text-base text-white/85">
                <p>Email: <a href="mailto:hello@crownedvictorsministry.org" className="text-[#D4AF37] hover:underline">hello@crownedvictorsministry.org</a></p>
                <p>Phone: <a href="tel:+1234567890" className="text-[#D4AF37] hover:underline">+1 (234) 567-890</a></p>
                <p>Location: Serving communities with faith, prayer, and purpose</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#D4AF37]/20 bg-white/70 py-6 text-center text-sm text-[#0B1F3A]/70">
        © 2026 Crowned Victors Ministry. All rights reserved.
      </footer>
    </div>
  );
}
