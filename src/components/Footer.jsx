import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, User, Clock, ShieldCheck, ChevronRight, Phone } from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';
import BrandLogo from './BrandLogo';

const CURRENT_YEAR = 2026;

export default function Footer() {
  return (
    <footer className="bg-[#161c28] text-slate-300 pt-16 pb-8 border-t border-slate-800 w-full select-none">
      {/* Full width container spanning edge-to-edge */}
      <div className="w-full px-6 sm:px-10 lg:px-12 xl:px-16">
        
        {/* Main Footer Grid spanning across full screen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-800/80 w-full">
          
          {/* Column 1: Society Identity (Left end) */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo size="default" />
            
            <p className="text-xs sm:text-[13px] tracking-normal [word-spacing:0.12em] text-[#ffba00] font-semibold">
              {SOCIETY_INFO.fullName}
            </p>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              Fostering agrarian sustainability, inclusive credit access, and mutual economic empowerment through cooperative solidarity and member-centric financial services.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
              <span>Multi-State Jurisdiction Cooperative Framework</span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-serif text-lg font-bold mb-4 relative inline-block">
              Quick Links
              <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#ffba00]"></span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: 'Home Page', path: '/' },
                { name: 'About Our Society', path: '/about' },
                { name: 'Features & Services', path: '/features' },
                { name: 'Loan Categories', path: '/loans' },
                { name: 'Articles & Updates', path: '/blog' },
                { name: 'Contact & Branch Office', path: '/contact' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="flex items-center gap-2 text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#ffba00]" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Cooperative Credit Services */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-serif text-lg font-bold mb-4 relative inline-block">
              Our Services
              <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#ffba00]"></span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                'Agricultural Development Loans',
                'Rural Enterprise & MSME Credit',
                'Farm Machinery & Equipment',
                'Member Term & Thrift Deposits',
                'Secured Gold Loan Facilities',
                'Allied Agro & Dairy Development'
              ].map((service) => (
                <li key={service}>
                  <Link
                    to="/loans"
                    className="flex items-center gap-2 text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#00b4a7]" />
                    <span>{service}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Establishment & Office Info (Right end) */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-serif text-lg font-bold mb-4 relative inline-block">
              Establishment Office
              <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#ffba00]"></span>
            </h4>
            
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#ffba00] mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  {SOCIETY_INFO.address.full}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">Landmark:</span>
                  <span className="font-medium text-slate-200">{SOCIETY_INFO.address.landmark}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#ffba00] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">Employer:</span>
                  <span className="font-semibold text-white">{SOCIETY_INFO.employer}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#ffba00] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">Direct Society Phone:</span>
                  <a href={`tel:${SOCIETY_INFO.phoneRaw}`} className="font-bold text-white hover:text-[#ffba00] transition-colors">
                    {SOCIETY_INFO.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">Working Hours:</span>
                  <span className="text-slate-300 text-xs">{SOCIETY_INFO.officeHours}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar Spanning Full Width */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4 w-full">
          <p>
            &copy; {CURRENT_YEAR} {SOCIETY_INFO.fullName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">Cooperative Society Registration Framework</span>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">
              Enquiry Counter
            </Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">
              Society Governance
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
