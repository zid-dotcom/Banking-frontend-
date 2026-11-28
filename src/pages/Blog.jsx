import React, { useEffect, useState } from 'react';
import { i18n } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  Search, 
  ChevronRight, 
  X, 
  Landmark,
  BookOpen
} from 'lucide-react';
import PageBanner from '../components/PageBanner';
import { BLOG_POSTS, SOCIETY_INFO } from '../data/societyData';

export default function Blog({ onOpenEnquiry }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    const revealElements = document.querySelectorAll('[data-blog-scroll-pop]');
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
  }, [selectedCategory, searchQuery]);

  const categories = ['All', 'Cooperative Banking', 'Financial Planning', 'Savings & Security', 'Enterprise Credit'];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white">
      {/* Banner with bright matching Unsplash photo */}
      <PageBanner
        title={t("blog.articlesCooperativeInsights", "Articles & Cooperative Insights")}
        subtitle={t("blog.advisoryGuidesRuralFinanceDevelopments", "Advisory guides, rural finance developments, and financial education from the Aurumfx member desk.")}
        breadcrumbs={[{ name: 'Blog' }]}
        image="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=80"
      />

      {/* Main Blog Content Area */}
      <section className="py-16 sm:py-24 bg-[#f8f9fa] blog-scroll-pop" data-blog-scroll-pop>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Controls: Category Filter + Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 blog-scroll-pop" data-blog-scroll-pop>
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-[#ffba00] shadow'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder={t("blog.searchArticles", "Search articles...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffba00]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Grid Layout: Articles + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Articles Column */}
            <div className="lg:col-span-8">
              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-serif font-bold text-lg text-slate-800">{t("blog.noArticlesMatchedYourCriteria", "No articles matched your criteria")}</h4>
                  <p className="text-xs text-slate-500 mt-1">{t("blog.trySelectingAnotherCategoryOr", "Try selecting another category or clear your search query.")}</p>
                  <button
                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                    className="mt-4 text-xs font-bold text-[#00b4a7] hover:underline"
                  >
                    {t("blog.resetFilters", "Reset Filters")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredPosts.map((post, index) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group blog-scroll-pop"
                      data-blog-scroll-pop
                      style={{ '--blog-reveal-delay': `${index * 100}ms` }}
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-[#ffba00] text-xs font-bold px-3 py-1 rounded">
                          {post.category}
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {post.readTime}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-[#00b4a7] transition-colors mb-3 leading-snug">
                            {post.title}
                          </h3>

                          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setActiveArticle(post)}
                            className="text-xs font-bold text-[#00b4a7] hover:text-[#00877c] flex items-center gap-1 cursor-pointer"
                          >
                            <span>{t("blog.readCompleteArticle", "Read Complete Article")}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[11px] text-slate-400">{t("blog.by", "By")} {post.author}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Society Mission Box */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm blog-scroll-pop" data-blog-scroll-pop>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded bg-[#ffba00] text-slate-900 flex items-center justify-center font-bold">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif font-bold text-base text-slate-900">{t("blog.societyKnowledgeDesk", "Society Knowledge Desk")}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {t("blog.articlesPublishedOnThisDesk", "Articles published on this desk are curated for the educational benefit of agrarian members of")} <strong>{SOCIETY_INFO.fullName}</strong>.
                </p>
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <strong>{t("blog.counterDesk", "Counter Desk:")}</strong> {SOCIETY_INFO.address.locality}{t("blog.thrissur", ", Thrissur")}
                </div>
              </div>

              {/* Recent Articles List */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm blog-scroll-pop" data-blog-scroll-pop style={{ '--blog-reveal-delay': '120ms' }}>
                <h4 className="font-serif font-bold text-base text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  {t("blog.featuredPublications", "Featured Publications")}
                </h4>
                <div className="space-y-4">
                  {BLOG_POSTS.slice(0, 3).map((item, index) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveArticle(item)}
                      className="cursor-pointer group flex items-start gap-3 blog-scroll-pop"
                      data-blog-scroll-pop
                      style={{ '--blog-reveal-delay': `${220 + index * 100}ms` }}
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div>
                        <h5 className="font-serif text-xs font-bold text-slate-900 group-hover:text-[#00b4a7] transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h5>
                        <span className="text-[11px] text-slate-400 mt-1 block">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Membership Callout */}
              <div className="bg-gradient-to-br from-slate-900 to-[#1b2434] rounded-xl p-6 text-white shadow-md blog-scroll-pop" data-blog-scroll-pop style={{ '--blog-reveal-delay': '220ms' }}>
                <span className="text-xs font-bold text-[#ffba00] uppercase tracking-wider block mb-2">
                  {t("blog.memberAdvisory", "Member Advisory")}
                </span>
                <h4 className="font-serif font-bold text-lg mb-2">{t("blog.needFinancialCounseling", "Need Financial Counseling?")}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {t("blog.speakWithOurSocietyAdvisory", "Speak with our society advisory cell to discuss customized borrowing for seasonal harvests and rural micro-enterprises.")}
                </p>
                <button
                  onClick={() => onOpenEnquiry({ title: i18n.t("blog.advisoryConsultationRequest", "Advisory Consultation Request") })}
                  className="w-full bg-[#ffba00] hover:bg-[#e6a700] text-slate-900 font-bold py-2.5 rounded text-xs transition-colors cursor-pointer"
                >
                  {t("blog.scheduleDeskConsultation", "Schedule Desk Consultation")}
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Modal for Reading Full Article */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            
            {/* Header banner in modal */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={activeArticle.image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
              
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="bg-[#ffba00] text-slate-900 text-xs font-bold px-3 py-1 rounded inline-block mb-2">
                  {activeArticle.category}
                </span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-white leading-tight">
                  {activeArticle.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
                  <span>{activeArticle.date}</span>
                  <span>•</span>
                  <span>{activeArticle.readTime}</span>
                  <span>•</span>
                  <span>{t("blog.author", "Author:")} {activeArticle.author}</span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6 sm:p-8 space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p className="font-medium text-slate-900 text-base sm:text-lg italic border-l-4 border-[#ffba00] pl-4">
                {activeArticle.excerpt}
              </p>

              <div className="pt-2 whitespace-pre-line text-slate-600">
                {activeArticle.content}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  {t("blog.publishedBy", "Published by")} <strong>{SOCIETY_INFO.fullName}</strong> {t("blog.advisoryDesk", "Advisory Desk")}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveArticle(null);
                      onOpenEnquiry({ title: `Discussion: ${activeArticle.title}` });
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    {t("blog.discussWithSocietyDesk", "Discuss With Society Desk")}
                  </button>
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    {t("common.close", "Close")}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
