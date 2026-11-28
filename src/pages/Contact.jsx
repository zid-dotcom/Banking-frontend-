import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Building2, 
  User, 
  Clock, 
  Send, 
  CheckCircle2, 
  Navigation,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';


export default function Contact() {
  const { t } = useTranslation();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    emailOrAddress: '',
    enquiryCategory: 'General Society Enquiry',
    message: ''
  });

  useEffect(() => {
    const revealElements = document.querySelectorAll('[data-contact-scroll-pop]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' }
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="bg-white">
      {/* Contact Banner: Unified full-width background matching older design, full phone visible on right, text on left */}
      <section className="relative pt-36 pb-24 md:pt-40 md:pb-28 lg:min-h-[400px] flex items-center bg-[#1e2a36] overflow-hidden select-none">
        
        {/* Full-width continuous image: edge-to-edge with telephone pushed comfortably to the right */}
        <img
          src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1920&q=80"
          alt={t("contact.contactRegisteredEstablishment", "Contact & Registered Establishment")}
          className="absolute inset-0 w-full h-full object-cover object-[85%_center] md:object-[92%_center] lg:object-[96%_center] xl:object-right"
        />

        {/* Soft gradient overlay: keeps text readable on the left, telephone clear and bright on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />

        {/* Left side text container shifted further left to avoid any overlap */}
        <div className="relative w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 z-10">
          <div className="max-w-md sm:max-w-lg lg:max-w-xl text-left">
            
            {/* Page Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-serif font-bold text-white tracking-tight leading-[1.16] mb-3 drop-shadow-md">
              {t("nav.contact", "Contacts")}
            </h1>

            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-white/90 drop-shadow-sm font-medium mb-3.5">
              <Link to="/" className="hover:text-white transition-colors">
                {t("nav.home", "Home")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              <span className="text-[#ffc107] font-semibold">{t("nav.contact", "Contacts")}</span>
            </nav>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-white/90 font-normal drop-shadow-sm leading-relaxed max-w-lg">
              {t("contact.bannerDesc", "Reach out to our apex headquarters or local branch network for immediate assistance.")}
            </p>

          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20 lg:py-28 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 3 Overview Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Card 1: Registered Establishment */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-[#ffba00] transition-colors blog-scroll-pop" data-contact-scroll-pop>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#ffba00]/15 text-slate-900 flex items-center justify-center mb-5">
                  <MapPin className="w-6 h-6 text-[#ffba00]" />
                </div>
                <h4 className="font-serif font-bold text-lg text-slate-900 mb-2">
                  {t("contact.registeredEstablishment", "Registered Establishment")}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {SOCIETY_INFO.address.full}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <strong>{t("contact.landmark", "Landmark:")}</strong> {SOCIETY_INFO.address.landmark}
              </div>
            </div>

            {/* Card 2: Society Governance */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-[#00b4a7] transition-colors blog-scroll-pop" data-contact-scroll-pop style={{ '--blog-reveal-delay': '120ms' }}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#00b4a7]/15 text-[#00b4a7] flex items-center justify-center mb-5">
                  <User className="w-6 h-6 text-[#00b4a7]" />
                </div>
                <h4 className="font-serif font-bold text-lg text-slate-900 mb-2">
                  {t("contact.societyAdministration", "Society Administration")}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t("contact.keyOfficerEmployer", "Key Officer / Employer:")} <strong className="text-slate-800">{SOCIETY_INFO.employer}</strong>
                </p>
                <p className="text-xs text-slate-700 mt-2 font-semibold">
                  {t("contact.officialContact", "Official Contact:")} <a href={`tel:${SOCIETY_INFO.phoneRaw}`} className="text-[#00b4a7] hover:underline">{SOCIETY_INFO.phone}</a>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {t("contact.operatingUnderMultiStateAgro", "Operating under Multi-State Agro Co-Operative Society statutory regulations.")}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
                <span>{t("contact.statutoryMemberRegistryMaintained", "Statutory Member Registry Maintained")}</span>
              </div>
            </div>

            {/* Card 3: Counter Hours */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-slate-800 transition-colors blog-scroll-pop" data-contact-scroll-pop style={{ '--blog-reveal-delay': '240ms' }}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-[#ffba00] flex items-center justify-center mb-5">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-lg text-slate-900 mb-2">
                  {t("contact.counterWorkingHours", "Counter Working Hours")}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {SOCIETY_INFO.officeHours}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                {t("contact.memberPassbookUpdatesApplicationCounter", "Member passbook updates & application counter open during regular hours.")}
              </div>
            </div>

          </div>

          {/* Contact Form & Location Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl shadow-md border border-slate-200 blog-scroll-pop" data-contact-scroll-pop>
              <span className="text-xs uppercase tracking-widest font-bold text-[#00b4a7] block mb-2">
                {t("contact.memberHelpDesk", "Member Help Desk")}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-4">
                {t("contact.submitAnOfficialSocietyEnquiry", "Submit An Official Society Enquiry")}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-8 leading-relaxed">
                {t("contact.haveQuestionsRegardingLoanEligibility", "Have questions regarding loan eligibility, thrift deposits, or society membership? Complete the form below to initiate correspondence with our desk.")}
              </p>

              {formSubmitted ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-emerald-200">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif font-bold text-xl text-slate-900 mb-2">
                    {t("contact.enquiryAcknowledged", "Enquiry Acknowledged")}
                  </h4>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                    {t("contact.thankYou", "Thank you,")} <span className="font-semibold text-slate-900">{formData.fullName}</span>{t("contact.yourEnquiryHasBeenRecorded", ". Your enquiry has been recorded in the counter ledger. Our desk representative will follow up with you.")}
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({
                        fullName: '',
                        contactNumber: '',
                        emailOrAddress: '',
                        enquiryCategory: 'General Society Enquiry',
                        message: ''
                      });
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    {t("contact.sendAnotherMessage", "Send Another Message")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("contact.fullNameApplicantName", "Full Name / Applicant Name *")}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t("contact.eGAnandMenon", "e.g. Anand Menon")}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4a7] text-slate-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("contact.contactPhoneNumber", "Contact Phone Number *")}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder={t("contact.eG98470xxxxx", "e.g. 98470XXXXX")}
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4a7] text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("contact.villageLocalityEmail", "Village / Locality / Email")}
                      </label>
                      <input
                        type="text"
                        placeholder={t("contact.eGArimpoorThrissur", "e.g. Arimpoor / Thrissur")}
                        value={formData.emailOrAddress}
                        onChange={(e) => setFormData({ ...formData, emailOrAddress: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4a7] text-slate-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("contact.enquirySchemeType", "Enquiry Scheme Type")}
                      </label>
                      <select
                        value={formData.enquiryCategory}
                        onChange={(e) => setFormData({ ...formData, enquiryCategory: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4a7] text-slate-900 text-sm bg-white"
                      >
                        <option value="General Society Enquiry">{t("contact.generalSocietyEnquiry", "General Society Enquiry")}</option>
                        <option value="Agricultural Crop Loan">{t("contact.agriculturalCropLoan", "Agricultural Crop Loan")}</option>
                        <option value="MSME & Rural Business Loan">{t("contact.msmeRuralBusinessLoan", "MSME & Rural Business Loan")}</option>
                        <option value="Farm Equipment Finance">{t("contact.farmEquipmentFinance", "Farm Equipment Finance")}</option>
                        <option value="Member Thrift & Deposit Schemes">{t("contact.memberThriftDepositSchemes", "Member Thrift & Deposit Schemes")}</option>
                        <option value="Secured Gold Loan Facility">{t("contact.securedGoldLoanFacility", "Secured Gold Loan Facility")}</option>
                        <option value="New Society Membership">{t("contact.newSocietyMembership", "New Society Membership")}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("contact.messageRequirementDescription", "Message / Requirement Description *")}
                    </label>
                    <textarea
                      rows="4"
                      required
                      placeholder={t("contact.pleaseShareYourBorrowingPurpose", "Please share your borrowing purpose, agricultural land size, or specific scheme queries...")}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4a7] text-slate-900 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#ffba00] hover:bg-[#e6a700] text-slate-900 font-bold py-3.5 px-6 rounded shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t("contact.submitEnquiryToDesk", "Submit Enquiry to Desk")}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Directions & Landmark Guide Column */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-[#161c28] text-white p-8 rounded-2xl shadow-xl border border-slate-800 blog-scroll-pop" data-contact-scroll-pop style={{ '--blog-reveal-delay': '120ms' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#ffba00] text-slate-900 flex items-center justify-center font-bold">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-white">{t("contact.howToReachUs", "How to Reach Us")}</h4>
                    <p className="text-xs text-slate-400">{t("contact.thrissurDistrictKerala", "Thrissur District, Kerala")}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                  <p className="leading-relaxed">
                    {t("contact.ourRegisteredEstablishmentOfficeIs", "Our registered establishment office is situated on the")} <strong>{t("contact.firstFloorV664", "First Floor (V/664)")}</strong> {t("contact.at", "at")} <strong>{t("contact.thekkekkaraAntonyMasterSquare", "Thekkekkara Antony Master Square")}</strong> {t("contact.in", "in")} <strong>{t("contact.kunnathangadi", "Kunnathangadi")}</strong>{t("contact.alongTheProminentConnectingRoute", ", along the prominent connecting route in Arimpoor, Veluthur P.O., Thrissur.")}
                  </p>

                  <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-[#ffba00] font-bold">{t("contact.building", "Building:")}</span>
                      <span>{t("contact.thekkekkaraAntonyMasterSquare2", "THEKKEKKARA ANTONY MASTER SQUARE")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-[#ffba00] font-bold">{t("contact.floorRoom", "Floor / Room:")}</span>
                      <span>{t("contact.firstFloorRoomNoV", "First Floor, Room No. V/664")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-[#ffba00] font-bold">{t("contact.postalArea", "Postal Area:")}</span>
                      <span>{t("contact.veluthurPOThrissur680012", "Veluthur P.O., Thrissur - 680012")}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    {t("contact.publicConveyanceAndRegionalBuses", "Public conveyance and regional buses connecting Thrissur town and Arimpoor stop adjacent to Kunnathangadi junction.")}
                  </p>
                </div>
              </div>

              {/* Visual Location Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm blog-scroll-pop" data-contact-scroll-pop style={{ '--blog-reveal-delay': '240ms' }}>
                <h5 className="font-serif font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#00b4a7]" />
                  <span>{t("contact.branchDeskChecklistForVisitors", "Branch Desk Checklist for Visitors")}</span>
                </h5>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                    <span>{t("contact.bringGovernmentPhotoKycAadhaar", "Bring Government Photo KYC (Aadhaar or Voter ID)")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                    <span>{t("contact.carryTwoPassportSizedPhotographs", "Carry two passport-sized photographs for member admission")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                    <span>{t("contact.forAgriculturalLoanInquiriesBring", "For agricultural loan inquiries, bring latest tax receipt or land lease notes")}</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Styled Map Visual Representation Section */}
      <section className="h-80 w-full relative bg-slate-900 overflow-hidden border-t border-slate-200">
        <div 
          className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 opacity-35"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1920&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="w-14 h-14 rounded-full bg-[#ffba00] text-slate-900 flex items-center justify-center shadow-2xl mb-3 animate-bounce">
            <MapPin className="w-8 h-8" />
          </div>
          <h4 className="text-white font-serif font-bold text-xl sm:text-2xl drop-shadow">
            {t("contact.kunnathangadiArimpoorThrissur", "Kunnathangadi, Arimpoor, Thrissur")}
          </h4>
          <p className="text-white text-xs sm:text-sm max-w-lg mt-1 drop-shadow">
            {t("contact.thekkekkaraAntonyMasterSquareVeluthur", "Thekkekkara Antony Master Square, Veluthur P.O., Thrissur, Kerala - 680012")}
          </p>
          <span className="mt-4 inline-block bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-medium border border-white/20">
            {t("contact.aurumfxMultiStateAgroCo", "Aurumfx Multi State Agro Co-operative Society Limited Head Office")}
          </span>
        </div>
      </section>

    </div>
  );
}
