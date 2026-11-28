import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Building2, User, Clock, ShieldCheck, ChevronRight, Phone } from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';
import BrandLogo from './BrandLogo';


const CURRENT_YEAR = 2026;

export default function Footer() {
  const { t } = useTranslation();

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
              {t("common.tagline", "Fostering agrarian sustainability, inclusive credit access, and mutual economic empowerment through cooperative solidarity.")}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
              <span>{t("footer.multiStateJurisdictionCooperativeFramework", "Multi-State Jurisdiction Cooperative Framework")}</span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-serif text-lg font-bold mb-4 relative inline-block">
              {t("nav.quickLinks", "Quick Links")}
              <span className="absolute -bottom-1.5 left-0 w-8 h-[2px] bg-[#ffba00]"></span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: t("nav.home", "Home"), path: '/' },
                { name: t("nav.about", "About"), path: '/about' },
                { name: t("nav.features", "Features"), path: '/features' },
                { name: t("nav.projects", "Projects"), path: '/projects' },
                { name: t("nav.loans", "Loans"), path: '/loans' },
                { name: t("nav.blog", "Blog"), path: '/blog' },
                { name: t("nav.contact", "Contacts"), path: '/contact' },
              ].map((item) => (
                <li key={item.path}>
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
              {t("footer.ourServices", "Our Services")}
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
              {t("footer.establishmentOffice", "Establishment Office")}
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
                  <span className="text-slate-400 block text-xs">{t("contact.landmark", "Landmark:")}</span>
                  <span className="font-medium text-slate-200">{SOCIETY_INFO.address.landmark}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#ffba00] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">{t("footer.employer", "Employer:")}</span>
                  <span className="font-semibold text-white">{SOCIETY_INFO.employer}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#ffba00] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">{t("footer.directSocietyPhone", "Direct Society Phone:")}</span>
                  <a href={`tel:${SOCIETY_INFO.phoneRaw}`} className="font-bold text-white hover:text-[#ffba00] transition-colors">
                    {SOCIETY_INFO.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-xs">{t("footer.workingHours", "Working Hours:")}</span>
                  <span className="text-slate-300 text-xs">{SOCIETY_INFO.officeHours}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar Spanning Full Width */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4 w-full">
          <p>
            &copy; {CURRENT_YEAR} {SOCIETY_INFO.fullName}. {t("common.copyright", "All Rights Reserved")}.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">{t("footer.cooperativeSocietyRegistrationFramework", "Cooperative Society Registration Framework")}</span>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">
              {t("contact.enquiryCounter", "Enquiry Counter")}
            </Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">
              {t("footer.societyGovernance", "Society Governance")}
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
