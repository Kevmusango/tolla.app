import React, { useState } from 'react';
import { EasyRewardService } from '../services/EasyRewardService';
import { Logo } from '../components/Logo';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';

interface OnboardProps {
  onNavigate: (route: string) => void;
  onSetAuthUser: (user: { id: string; role: 'owner' | 'manager'; businessId: string; locationId: string | null }) => void;
}

// 95% Coverage Category -> Sub-Industry mapping with automated Business Type classifications
export const INDUSTRY_CATEGORIES: Record<string, { label: string; items: { name: string; type: string }[] }> = {
  beauty: {
    label: "💇 Beauty & Personal Care",
    items: [
      { name: "Hair Salon", type: "Service" },
      { name: "Barber Shop", type: "Service" },
      { name: "Nail Salon", type: "Service" },
      { name: "Beauty Salon", type: "Service" },
      { name: "Spa", type: "Service" },
      { name: "Massage Therapy", type: "Service" },
      { name: "Makeup Artist", type: "Service" },
      { name: "Skincare Clinic", type: "Service" },
      { name: "Cosmetic Clinic", type: "Service" },
      { name: "Tattoo Studio", type: "Service" },
      { name: "Piercing Studio", type: "Service" }
    ]
  },
  food: {
    label: "☕ Food & Beverage",
    items: [
      { name: "Restaurant", type: "Food" },
      { name: "Fast Food", type: "Food" },
      { name: "Café", type: "Food" },
      { name: "Coffee Shop", type: "Food" },
      { name: "Bakery", type: "Food" },
      { name: "Ice Cream Shop", type: "Food" },
      { name: "Pizza Shop", type: "Food" },
      { name: "Butchery", type: "Retail" },
      { name: "Grocery Store", type: "Retail" },
      { name: "Convenience Store", type: "Retail" },
      { name: "Supermarket", type: "Retail" },
      { name: "Bottle Store", type: "Retail" },
      { name: "Fresh Produce Store", type: "Retail" }
    ]
  },
  automotive: {
    label: "🚗 Automotive",
    items: [
      { name: "Car Wash", type: "Service" },
      { name: "Auto Repair & Mechanic", type: "Service" },
      { name: "Panel Beating & Spray Painting", type: "Service" },
      { name: "Tyre Shop", type: "Retail" },
      { name: "Auto Parts Store", type: "Retail" },
      { name: "Car Dealership", type: "Retail" },
      { name: "Motorcycle Dealership", type: "Retail" },
      { name: "Vehicle Inspection", type: "Service" },
      { name: "Car Rental", type: "Service" },
      { name: "Towing Service", type: "Service" },
      { name: "Auto Electrical", type: "Service" },
      { name: "Windscreen Repair", type: "Service" },
      { name: "Vehicle Detailing", type: "Service" },
      { name: "Battery Centre", type: "Retail" }
    ]
  },
  fitness: {
    label: "🏋️ Fitness & Wellness",
    items: [
      { name: "Gym", type: "Membership" },
      { name: "Personal Trainer", type: "Service" },
      { name: "Yoga Studio", type: "Membership" },
      { name: "Pilates Studio", type: "Membership" },
      { name: "Dance Studio", type: "Membership" },
      { name: "Martial Arts Academy", type: "Membership" },
      { name: "Swimming School", type: "Education" },
      { name: "Sports Club", type: "Membership" }
    ]
  },
  health: {
    label: "🏥 Health",
    items: [
      { name: "Pharmacy", type: "Retail" },
      { name: "Dentist", type: "Professional" },
      { name: "Medical Practice", type: "Professional" },
      { name: "Physiotherapy", type: "Professional" },
      { name: "Chiropractor", type: "Professional" },
      { name: "Optometrist", type: "Professional" },
      { name: "Audiologist", type: "Professional" },
      { name: "Psychologist", type: "Professional" },
      { name: "Occupational Therapist", type: "Professional" },
      { name: "Veterinary Clinic", type: "Professional" }
    ]
  },
  pet: {
    label: "🐶 Pet Services",
    items: [
      { name: "Pet Grooming", type: "Service" },
      { name: "Veterinary Clinic", type: "Professional" },
      { name: "Pet Shop", type: "Retail" },
      { name: "Dog Training", type: "Service" },
      { name: "Pet Boarding", type: "Service" }
    ]
  },
  home: {
    label: "🏠 Home & Property",
    items: [
      { name: "Cleaning Services", type: "Service" },
      { name: "Pest Control", type: "Service" },
      { name: "Plumbing", type: "Service" },
      { name: "Electrical Services", type: "Service" },
      { name: "Painting Services", type: "Service" },
      { name: "Roofing", type: "Service" },
      { name: "Landscaping", type: "Service" },
      { name: "Gardening", type: "Service" },
      { name: "Security Company", type: "Service" },
      { name: "Pool Services", type: "Service" },
      { name: "Home Renovations", type: "Service" },
      { name: "Flooring", type: "Service" },
      { name: "Carpentry", type: "Service" }
    ]
  },
  education: {
    label: "📚 Education",
    items: [
      { name: "Tutoring Centre", type: "Education" },
      { name: "Driving School", type: "Education" },
      { name: "Music School", type: "Education" },
      { name: "Language School", type: "Education" },
      { name: "Daycare", type: "Education" },
      { name: "Preschool", type: "Education" },
      { name: "Private School", type: "Education" },
      { name: "College", type: "Education" },
      { name: "Training Centre", type: "Education" }
    ]
  },
  retail: {
    label: "🛍️ Retail",
    items: [
      { name: "Clothing Store", type: "Retail" },
      { name: "Shoe Store", type: "Retail" },
      { name: "Fashion Boutique", type: "Retail" },
      { name: "Jewellery Store", type: "Retail" },
      { name: "Gift Shop", type: "Retail" },
      { name: "Cellphone Store", type: "Retail" },
      { name: "Electronics Store", type: "Retail" },
      { name: "Computer Store", type: "Retail" },
      { name: "Furniture Store", type: "Retail" },
      { name: "Appliance Store", type: "Retail" },
      { name: "Hardware Store", type: "Retail" },
      { name: "Stationery Store", type: "Retail" },
      { name: "Toy Store", type: "Retail" },
      { name: "Book Store", type: "Retail" },
      { name: "Florist", type: "Retail" }
    ]
  },
  financial: {
    label: "💰 Financial & Business",
    items: [
      { name: "Accounting Firm", type: "Professional" },
      { name: "Tax Consultant", type: "Professional" },
      { name: "Insurance Broker", type: "Professional" },
      { name: "Financial Advisor", type: "Professional" },
      { name: "Legal Practice", type: "Professional" },
      { name: "Real Estate Agency", type: "Professional" },
      { name: "Recruitment Agency", type: "Professional" },
      { name: "Travel Agency", type: "Professional" }
    ]
  },
  professional: {
    label: "🔧 Professional Services",
    items: [
      { name: "Printing Shop", type: "Retail" },
      { name: "Graphic Design Studio", type: "Professional" },
      { name: "Photography Studio", type: "Professional" },
      { name: "Marketing Agency", type: "Professional" },
      { name: "Web Design Agency", type: "Professional" },
      { name: "IT Support", type: "Professional" },
      { name: "Software Company", type: "Professional" },
      { name: "Internet Café", type: "Service" }
    ]
  },
  logistics: {
    label: "📦 Logistics",
    items: [
      { name: "Courier Service", type: "Distribution" },
      { name: "Moving Company", type: "Distribution" },
      { name: "Transport Company", type: "Distribution" },
      { name: "Freight Services", type: "Distribution" },
      { name: "Storage Facility", type: "Service" }
    ]
  },
  hospitality: {
    label: "🏨 Hospitality",
    items: [
      { name: "Hotel", type: "Service" },
      { name: "Guest House", type: "Service" },
      { name: "Lodge", type: "Service" },
      { name: "Bed & Breakfast", type: "Service" },
      { name: "Backpackers", type: "Service" },
      { name: "Event Venue", type: "Service" },
      { name: "Conference Centre", type: "Service" }
    ]
  },
  events: {
    label: "🎉 Events",
    items: [
      { name: "Event Planner", type: "Professional" },
      { name: "Wedding Planner", type: "Professional" },
      { name: "Party Hire", type: "Service" },
      { name: "DJ Services", type: "Service" },
      { name: "Catering Company", type: "Food" },
      { name: "Photography", type: "Professional" },
      { name: "Videography", type: "Professional" }
    ]
  },
  community: {
    label: "🛒 Local & Community",
    items: [
      { name: "Spaza Shop", type: "Retail" },
      { name: "General Dealer", type: "Retail" },
      { name: "Mini Market", type: "Retail" },
      { name: "Water Refill Shop", type: "Retail" },
      { name: "Water Delivery Service", type: "Distribution" },
      { name: "Gas Refill", type: "Retail" },
      { name: "Laundry", type: "Service" },
      { name: "Dry Cleaner", type: "Service" },
      { name: "Tailor", type: "Service" },
      { name: "Shoe Repair", type: "Service" },
      { name: "Locksmith", type: "Service" },
      { name: "Key Cutting", type: "Service" },
      { name: "Watch Repair", type: "Service" }
    ]
  },
  secondhand: {
    label: "♻️ Second-Hand & Resale",
    items: [
      { name: "Pawn Shop", type: "Retail" },
      { name: "Second-Hand Store", type: "Retail" },
      { name: "Thrift Store", type: "Retail" },
      { name: "Used Furniture Store", type: "Retail" },
      { name: "Used Appliance Store", type: "Retail" },
      { name: "Used Electronics Store", type: "Retail" },
      { name: "Second-Hand Book Store", type: "Retail" }
    ]
  },
  manufacturing: {
    label: "🏭 Manufacturing",
    items: [
      { name: "Furniture Manufacturer", type: "Manufacturing" },
      { name: "Clothing Manufacturer", type: "Manufacturing" },
      { name: "Bakery Production", type: "Manufacturing" },
      { name: "Food Manufacturer", type: "Manufacturing" },
      { name: "Custom Manufacturing", type: "Manufacturing" }
    ]
  },
  agriculture: {
    label: "🌾 Agriculture",
    items: [
      { name: "Farm Stall", type: "Retail" },
      { name: "Nursery", type: "Retail" },
      { name: "Garden Centre", type: "Retail" },
      { name: "Agricultural Supplies", type: "Retail" },
      { name: "Livestock Services", type: "Service" }
    ]
  },
  other: {
    label: "🕌 Other / Custom",
    items: [
      { name: "Non-Profit Organisation", type: "Other" },
      { name: "Religious Organisation", type: "Other" },
      { name: "Government Service", type: "Other" },
      { name: "Community Organisation", type: "Other" },
      { name: "Other (Custom)", type: "Other" }
    ]
  }
};

const BUSINESS_TYPES = ["Service", "Food", "Retail", "Distribution", "Professional", "Membership", "Education", "Manufacturing", "Other"];

export const Onboard: React.FC<OnboardProps> = ({ onNavigate, onSetAuthUser }) => {
  const [bizName, setBizName] = useState('');
  
  // Dual-level selectors state
  const [selectedCategory, setSelectedCategory] = useState('beauty');
  const [selectedSubIndustry, setSelectedSubIndustry] = useState('Hair Salon');
  const [customIndustryVal, setCustomIndustryVal] = useState('');
  const [customBusinessType, setCustomBusinessType] = useState('Service');

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName || !whatsappNumber) {
      setError('Please fill out all required fields.');
      return;
    }

    // Determine values to save
    const isCustom = selectedSubIndustry === 'Other (Custom)' || selectedCategory === 'other';
    const finalIndustry = isCustom ? (customIndustryVal.trim() || 'Custom Business') : selectedSubIndustry;
    const finalCustomIndustry = isCustom ? finalIndustry : undefined;
    
    // Resolve business type
    let finalType = 'Other';
    if (isCustom) {
      finalType = customBusinessType;
    } else {
      const match = INDUSTRY_CATEGORIES[selectedCategory]?.items.find(i => i.name === selectedSubIndustry);
      if (match) finalType = match.type;
    }

    setIsLoading(true);
    setError('');

    try {
      let cleanedPhone = whatsappNumber.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
        cleanedPhone = '27' + cleanedPhone.substring(1);
      }

      const derivedEmail = `${cleanedPhone}@tolla.app`;
      const derivedPassword = `Tolla_OTP_Password_${cleanedPhone}`;


      // 1. Sign Up owner user in Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: derivedEmail,
        password: derivedPassword,
        options: {
          data: {
            first_name: bizName,
            whatsapp_number: cleanedPhone
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already')) {
          // Gracefully allow registered users to proceed
        } else if (signUpError.message.toLowerCase().includes('rate limit') || signUpError.message.toLowerCase().includes('429')) {
          setError('Too many registration attempts from this connection. Please wait a few minutes or log in if you already have an account.');
          setIsLoading(false);
          return;
        } else {
          setError(signUpError.message);
          setIsLoading(false);
          return;
        }
      }

      // 2. Generate OTP and dispatch WhatsApp message
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;

      if (phoneId && accessToken) {
        console.log(`[EasyReward Onboard OTP] Sending real WhatsApp OTP to ${cleanedPhone}...`);
        await fetch(
          `https://graph.facebook.com/v18.0/${phoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: cleanedPhone,
              type: "template",
              template: {
                name: "tolla_otp",
                language: { code: "en_US" },
                components: [
                  {
                    type: "body",
                    parameters: [{ type: "text", text: code }]
                  },
                  {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [{ type: "text", text: code }]
                  }
                ]
              }
            })
          }
        );
      } else {
        console.log(`[EasyReward Onboard OTP] Simulated WhatsApp OTP to ${cleanedPhone}: ${code}`);
      }

      // 3. Save pending onboarding metadata in localStorage
      localStorage.setItem('tolla_pending_onboarding', JSON.stringify({
        bizName,
        industry: finalIndustry,
        customIndustry: finalCustomIndustry || '',
        businessType: finalType,
        whatsappNumber: cleanedPhone
      }));

      // Save phone and OTP code to auto-load in Login page
      localStorage.setItem('tolla_pending_onboard_phone', whatsappNumber);
      localStorage.setItem('tolla_pending_otp', code);

      // Redirect to Login to verify the code and log in
      onNavigate('login');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-txtprimary flex flex-col items-center justify-center p-6 transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => onNavigate('home')}>
        <Logo className="w-9 h-9" />
        <span className="font-extrabold text-2xl text-accent-primary">
          Tolla
        </span>
      </div>

      <div className="max-w-xl w-full glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-divider">
        <h2 className="text-2xl font-bold font-sans text-center mb-1 text-txtprimary">
          Register Your Business
        </h2>
        <p className="text-txtsecondary text-center mb-8 text-sm">
          Get set up and receive your static QR code in under 2 minutes.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex items-center gap-1.5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-accent-red shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-primary">
              1. Business Profile
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-txtsecondary mb-1.5 font-medium">Business Name *</label>
                <input 
                  type="text" 
                  value={bizName} 
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Silk & Shears"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-txtsecondary mb-1.5 font-medium">Industry Category *</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => {
                    const cat = e.target.value;
                    setSelectedCategory(cat);
                    const defaultSub = INDUSTRY_CATEGORIES[cat]?.items[0]?.name || '';
                    setSelectedSubIndustry(defaultSub);
                  }}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-panel"
                >
                  {Object.entries(INDUSTRY_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-txtsecondary mb-1.5 font-medium">Business Sub-Type *</label>
                <select 
                  value={selectedSubIndustry} 
                  onChange={(e) => setSelectedSubIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-panel"
                >
                  {INDUSTRY_CATEGORIES[selectedCategory]?.items.map(item => (
                    <option key={item.name} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>

              {/* Show custom inputs if other/custom is picked */}
              {(selectedSubIndustry === 'Other (Custom)' || selectedCategory === 'other') && (
                <div className="space-y-4 md:col-span-2 grid md:grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-2xl border border-divider">
                  <div>
                    <label className="block text-xs text-txtsecondary mb-1.5 font-medium">Custom Industry Name *</label>
                    <input 
                      type="text" 
                      value={customIndustryVal} 
                      onChange={(e) => setCustomIndustryVal(e.target.value)}
                      placeholder="e.g. Handmade Soap Maker"
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-txtsecondary mb-1.5 font-medium">Business Type Category *</label>
                    <select 
                      value={customBusinessType} 
                      onChange={(e) => setCustomBusinessType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-white"
                    >
                      {BUSINESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-divider my-2" />

          {/* Owner Account Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-primary">
              2. Owner Account
            </h3>

            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block text-xs text-txtsecondary mb-1.5 font-medium">WhatsApp Number *</label>
                <input 
                  type="tel" 
                  value={whatsappNumber} 
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +27821111111"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  required
                />
                <span className="text-[9px] text-txtsecondary block mt-1 leading-relaxed">
                  Used for system alerts and login context.
                </span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Create My Business Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 flex gap-4 text-xs text-txtsecondary font-medium">
        <button onClick={() => onNavigate('login')} className="hover:text-txtprimary underline">
          Already registered? Sign In
        </button>
        <span>•</span>
        <button onClick={() => onNavigate('home')} className="hover:text-txtprimary underline">
          Back to Homepage
        </button>
      </div>
    </div>
  );
};
