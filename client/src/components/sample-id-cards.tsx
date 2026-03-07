import { useId } from "react";
import { getBorrowerAvatarUrl } from "@/lib/avatar";

interface BorrowerData {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  nationalId: string;
  ghanaCardNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  passportNumber?: string | null;
  type: string;
  region?: string | null;
  city?: string | null;
  driversLicense?: string | null;
}

function formatDOB(dob: string | null | undefined): string {
  if (!dob) return "-- / -- / ----";
  const d = new Date(dob);
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
}

function formatExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
}

function getFullName(b: BorrowerData): string {
  if (b.companyName) return b.companyName;
  return [b.firstName, b.lastName].filter(Boolean).join(" ") || "Unknown";
}

export function GhanaCardSample({ borrower }: { borrower: BorrowerData }) {
  const uid = useId().replace(/:/g, "");
  const cardNumber = borrower.ghanaCardNumber || borrower.nationalId;
  const avatarUrl = getBorrowerAvatarUrl(borrower.nationalId);
  const name = getFullName(borrower);

  const bgId = `gc-bg-${uid}`;
  const goldId = `gc-gold-${uid}`;
  const clipId = `gc-clip-${uid}`;

  return (
    <div className="relative w-full max-w-[400px] select-none" data-testid="sample-ghana-card">
      <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-xl shadow-lg" role="img" aria-label={`Sample Ghana Card for ${name}`}>
        <title>Sample Ghana Card - {name}</title>
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="400" y2="252" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1a3a5c" />
            <stop offset="100%" stopColor="#0d2137" />
          </linearGradient>
          <linearGradient id={goldId} x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c8960c" />
            <stop offset="50%" stopColor="#f0c040" />
            <stop offset="100%" stopColor="#c8960c" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="16" y="68" width="90" height="110" rx="6" />
          </clipPath>
        </defs>

        <rect width="400" height="252" rx="14" fill={`url(#${bgId})`} />

        <rect x="0" y="0" width="400" height="5" rx="0" fill="#CE1126" />
        <rect x="0" y="5" width="400" height="5" fill={`url(#${goldId})`} />
        <rect x="0" y="10" width="400" height="5" fill="#006B3F" />

        <rect x="0" y="242" width="400" height="5" fill="#006B3F" />
        <rect x="0" y="247" width="400" height="5" fill={`url(#${goldId})`} />

        <circle cx="30" cy="33" r="14" fill="#006B3F" stroke={`url(#${goldId})`} strokeWidth="1.5" />
        <text x="30" y="30" textAnchor="middle" fill={`url(#${goldId})`} fontSize="7" fontWeight="bold" fontFamily="serif">
          <tspan x="30" dy="0">GH</tspan>
          <tspan x="30" dy="8" fontSize="5">NIA</tspan>
        </text>

        <text x="54" y="30" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.5">
          REPUBLIC OF GHANA
        </text>
        <text x="54" y="42" fill="#f0c040" fontSize="7.5" fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="1">
          NATIONAL IDENTIFICATION CARD
        </text>
        <text x="54" y="52" fill="#8ab4d8" fontSize="6" fontFamily="Arial, sans-serif" letterSpacing="0.5">
          GHANA CARD / CARTE D'IDENTITE
        </text>

        <rect x="16" y="68" width="90" height="110" rx="6" fill="#1e4a6e" stroke="#3a7bb5" strokeWidth="1" />
        <image href={avatarUrl} x="16" y="68" width="90" height="110" clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />

        <text x="120" y="82" fill="#8ab4d8" fontSize="6.5" fontFamily="Arial, sans-serif">SURNAME / NOM</text>
        <text x="120" y="94" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">
          {(borrower.lastName || "").toUpperCase().slice(0, 20)}
        </text>

        <text x="120" y="110" fill="#8ab4d8" fontSize="6.5" fontFamily="Arial, sans-serif">GIVEN NAMES / PRENOMS</text>
        <text x="120" y="122" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">
          {(borrower.firstName || "").toUpperCase().slice(0, 20)}
        </text>

        <text x="120" y="138" fill="#8ab4d8" fontSize="6.5" fontFamily="Arial, sans-serif">DATE OF BIRTH / DATE DE NAISSANCE</text>
        <text x="120" y="150" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">
          {formatDOB(borrower.dateOfBirth)}
        </text>

        <text x="120" y="166" fill="#8ab4d8" fontSize="6.5" fontFamily="Arial, sans-serif">SEX / SEXE</text>
        <text x="120" y="178" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">
          {borrower.gender === "Male" ? "M" : borrower.gender === "Female" ? "F" : "--"}
        </text>

        <text x="200" y="166" fill="#8ab4d8" fontSize="6.5" fontFamily="Arial, sans-serif">NATIONALITY</text>
        <text x="200" y="178" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">GHANAIAN</text>

        <rect x="16" y="190" width="368" height="24" rx="4" fill="#0a1929" />
        <text x="24" y="198" fill="#8ab4d8" fontSize="6" fontFamily="Arial, sans-serif">PERSONAL ID NUMBER / NUMERO D'IDENTIFICATION</text>
        <text x="24" y="210" fill="#f0c040" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="1.5">
          {cardNumber}
        </text>

        <text x="16" y="230" fill="#8ab4d8" fontSize="6" fontFamily="Arial, sans-serif">EXPIRY / EXPIRATION</text>
        <text x="16" y="240" fill="#ffffff" fontSize="8" fontFamily="Arial, sans-serif">{formatExpiry()}</text>

        <rect x="280" y="220" width="36" height="26" rx="3" fill="#1e4a6e" stroke="#3a7bb5" strokeWidth="0.5" />
        <rect x="283" y="223" width="6" height="8" rx="1" fill="#f0c040" opacity="0.6" />
        <rect x="291" y="223" width="6" height="8" rx="1" fill="#f0c040" opacity="0.4" />
        <rect x="283" y="233" width="6" height="8" rx="1" fill="#f0c040" opacity="0.3" />
        <rect x="291" y="233" width="6" height="8" rx="1" fill="#f0c040" opacity="0.5" />

        <text x="330" y="240" fill="#8ab4d8" fontSize="5.5" fontFamily="Arial, sans-serif" textAnchor="start">
          ECOWAS / CEDEAO
        </text>

        <text x="200" y="130" fill="none" stroke="#CE1126" strokeWidth="0.6" fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle" opacity="0.18" transform="rotate(-25, 200, 130)">
          SAMPLE
        </text>
      </svg>
    </div>
  );
}

export function GhanaPassportSample({ borrower }: { borrower: BorrowerData }) {
  const uid = useId().replace(/:/g, "");
  const avatarUrl = getBorrowerAvatarUrl(borrower.nationalId);
  const name = getFullName(borrower);

  const bgId = `pp-bg-${uid}`;
  const goldId = `pp-gold-${uid}`;
  const clipId = `pp-clip-${uid}`;

  return (
    <div className="relative w-full max-w-[400px] select-none" data-testid="sample-ghana-passport">
      <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-xl shadow-lg" role="img" aria-label={`Sample Ghana Passport for ${name}`}>
        <title>Sample Ghana Passport - {name}</title>
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="400" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0a2e1a" />
            <stop offset="100%" stopColor="#0d4422" />
          </linearGradient>
          <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c8960c" />
            <stop offset="50%" stopColor="#f0c040" />
            <stop offset="100%" stopColor="#c8960c" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="22" y="80" width="85" height="105" rx="5" />
          </clipPath>
        </defs>

        <rect width="400" height="280" rx="14" fill={`url(#${bgId})`} />

        <rect x="8" y="8" width="384" height="264" rx="10" fill="none" stroke="#c8960c" strokeWidth="1" opacity="0.3" />

        <text x="200" y="24" textAnchor="middle" fill="#c8960c" fontSize="7" fontFamily="Arial, sans-serif" letterSpacing="2">
          ECOWAS / CEDEAO
        </text>

        <circle cx="200" cy="46" r="16" fill="none" stroke="#c8960c" strokeWidth="1" />
        <text x="200" y="43" textAnchor="middle" fill="#c8960c" fontSize="7" fontWeight="bold" fontFamily="serif">
          <tspan x="200" dy="0">GH</tspan>
          <tspan x="200" dy="9" fontSize="5">COAT</tspan>
        </text>

        <text x="200" y="72" textAnchor="middle" fill="#f0c040" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="1">
          REPUBLIC OF GHANA
        </text>

        <rect x="22" y="80" width="85" height="105" rx="5" fill="#0a3318" stroke="#2a7a45" strokeWidth="0.8" />
        <image href={avatarUrl} x="22" y="80" width="85" height="105" clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />

        <text x="120" y="95" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">TYPE / TYPE</text>
        <text x="120" y="106" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">P</text>

        <text x="160" y="95" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">COUNTRY CODE</text>
        <text x="160" y="106" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">GHA</text>

        <text x="240" y="95" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">PASSPORT NO.</text>
        <text x="240" y="106" fill="#f0c040" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="1">
          {borrower.passportNumber || "GH------"}
        </text>

        <text x="120" y="122" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">SURNAME / NOM</text>
        <text x="120" y="134" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">
          {(borrower.lastName || "").toUpperCase().slice(0, 22)}
        </text>

        <text x="120" y="150" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">GIVEN NAMES / PRENOMS</text>
        <text x="120" y="162" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">
          {(borrower.firstName || "").toUpperCase().slice(0, 22)}
        </text>

        <text x="120" y="178" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">DATE OF BIRTH</text>
        <text x="120" y="190" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">{formatDOB(borrower.dateOfBirth)}</text>

        <text x="260" y="178" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">SEX</text>
        <text x="260" y="190" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">
          {borrower.gender === "Male" ? "M" : borrower.gender === "Female" ? "F" : "--"}
        </text>

        <text x="120" y="206" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">PLACE OF BIRTH</text>
        <text x="120" y="218" fill="#ffffff" fontSize="10" fontFamily="Arial, sans-serif">
          {(borrower.city || "ACCRA").toUpperCase()}, GHANA
        </text>

        <text x="120" y="234" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">DATE OF ISSUE</text>
        <text x="120" y="246" fill="#ffffff" fontSize="9" fontFamily="Arial, sans-serif">15 / 01 / 2026</text>

        <text x="260" y="234" fill="#6aab7e" fontSize="6" fontFamily="Arial, sans-serif">DATE OF EXPIRY</text>
        <text x="260" y="246" fill="#ffffff" fontSize="9" fontFamily="Arial, sans-serif">{formatExpiry()}</text>

        <rect x="22" y="256" width="356" height="16" rx="2" fill="#051a0c" />
        <text x="28" y="267" fill="#6aab7e" fontSize="7" fontFamily="monospace" letterSpacing="1" opacity="0.7">
          P&lt;GHA{(borrower.lastName || "").toUpperCase().slice(0, 12)}&lt;&lt;{(borrower.firstName || "").toUpperCase().slice(0, 12)}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </text>

        <text x="200" y="155" fill="none" stroke="#CE1126" strokeWidth="0.7" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle" opacity="0.15" transform="rotate(-25, 200, 155)">
          SAMPLE
        </text>
      </svg>
    </div>
  );
}

export function SampleDriversLicense({ borrower }: { borrower: BorrowerData }) {
  const uid = useId().replace(/:/g, "");
  const avatarUrl = getBorrowerAvatarUrl(borrower.nationalId);
  const name = getFullName(borrower);

  const bgId = `dl-bg-${uid}`;
  const clipId = `dl-clip-${uid}`;

  return (
    <div className="relative w-full max-w-[400px] select-none" data-testid="sample-drivers-license">
      <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-xl shadow-lg" role="img" aria-label={`Sample Ghana Driver's License for ${name}`}>
        <title>Sample Ghana Driver's License - {name}</title>
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8f4e8" />
            <stop offset="100%" stopColor="#e8e0cc" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="16" y="62" width="80" height="100" rx="5" />
          </clipPath>
        </defs>

        <rect width="400" height="240" rx="14" fill={`url(#${bgId})`} />

        <rect x="0" y="0" width="400" height="4" rx="0" fill="#CE1126" />
        <rect x="0" y="4" width="400" height="4" fill="#f0c040" />
        <rect x="0" y="8" width="400" height="4" fill="#006B3F" />

        <text x="200" y="28" textAnchor="middle" fill="#1a1a1a" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="1">
          REPUBLIC OF GHANA
        </text>
        <text x="200" y="40" textAnchor="middle" fill="#CE1126" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.5">
          DRIVER AND VEHICLE LICENSING AUTHORITY
        </text>
        <text x="200" y="52" textAnchor="middle" fill="#333" fontSize="7" fontFamily="Arial, sans-serif" letterSpacing="1">
          DRIVING LICENCE / PERMIS DE CONDUIRE
        </text>

        <rect x="16" y="62" width="80" height="100" rx="5" fill="#ddd" stroke="#999" strokeWidth="0.8" />
        <image href={avatarUrl} x="16" y="62" width="80" height="100" clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />

        <text x="110" y="76" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">1. SURNAME</text>
        <text x="110" y="88" fill="#1a1a1a" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">
          {(borrower.lastName || "").toUpperCase().slice(0, 20)}
        </text>

        <text x="110" y="102" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">2. OTHER NAMES</text>
        <text x="110" y="114" fill="#1a1a1a" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">
          {(borrower.firstName || "").toUpperCase().slice(0, 20)}
        </text>

        <text x="110" y="128" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">3. DATE OF BIRTH</text>
        <text x="110" y="140" fill="#1a1a1a" fontSize="9" fontFamily="Arial, sans-serif">{formatDOB(borrower.dateOfBirth)}</text>

        <text x="280" y="128" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">4. SEX</text>
        <text x="280" y="140" fill="#1a1a1a" fontSize="9" fontFamily="Arial, sans-serif">
          {borrower.gender === "Male" ? "M" : borrower.gender === "Female" ? "F" : "--"}
        </text>

        <text x="110" y="156" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">5. LICENCE NUMBER</text>
        <text x="110" y="168" fill="#CE1126" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="1">
          {borrower.driversLicense || "DL---------"}
        </text>

        <text x="16" y="182" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">8. PLACE OF RESIDENCE</text>
        <text x="16" y="194" fill="#1a1a1a" fontSize="8" fontFamily="Arial, sans-serif">
          {borrower.city || "Accra"}, {borrower.region || "Greater Accra"}
        </text>

        <text x="16" y="210" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">DATE OF ISSUE</text>
        <text x="16" y="222" fill="#1a1a1a" fontSize="8" fontFamily="Arial, sans-serif">10 / 03 / 2026</text>

        <text x="160" y="210" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">DATE OF EXPIRY</text>
        <text x="160" y="222" fill="#1a1a1a" fontSize="8" fontFamily="Arial, sans-serif">{formatExpiry()}</text>

        <text x="300" y="210" fill="#666" fontSize="6" fontFamily="Arial, sans-serif">CLASSES</text>
        <text x="300" y="222" fill="#1a1a1a" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">B, C</text>

        <rect x="0" y="232" width="400" height="4" fill="#006B3F" />
        <rect x="0" y="236" width="400" height="4" fill="#f0c040" />

        <text x="200" y="140" fill="none" stroke="#CE1126" strokeWidth="0.6" fontSize="36" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle" opacity="0.15" transform="rotate(-25, 200, 140)">
          SAMPLE
        </text>
      </svg>
    </div>
  );
}
