"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, DollarSign } from 'lucide-react';

interface BookingFormData {
  sessionType: string;
  numberOfPeople: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface FormErrors {
  sessionType?: string;
  numberOfPeople?: string;
  date?: string;
  time?: string;
  name?: string;
  email?: string;
  phone?: string;
}

// PRICING DATA - matches your price sheet
const PRICING = {
  'Headshot (Basic)': { base: 65, type: 'individual' },
  'Headshot (Standard)': { base: 100, type: 'individual' },
  'Headshot (Pro)': { base: 175, type: 'individual' },
  'Grp. Headshot (2-4)': { base: 55, type: 'group' },
  'Grp. Headshot (5-9)': { base: 45, type: 'group' },
  'Grp. Headshot (10+)': { base: 40, type: 'group' },
  'Modeling (Basic)': { base: 85, type: 'individual' },
  'Modeling (Standard)': { base: 130, type: 'individual' },
  'Modeling (Pro)': { base: 200, type: 'individual' },
  'Grp. Modeling (2-4)': { base: 70, type: 'group' },
  'Grp. Modeling (5-9)': { base: 60, type: 'group' },
  'Grp. Modeling (10+)': { base: 55, type: 'group' },
};

// Generate time slots from 9am to 8pm
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 20; hour++) {
    const time = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
    slots.push({ value: `${hour}:00`, label: time });
  }
  return slots;
};

const BookingPage = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    sessionType: '',
    numberOfPeople: 1,
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [errors, setErrors] = useState<Partial<FormErrors>>({});

  const timeSlots = generateTimeSlots();

  // Calculate price whenever relevant fields change
  useEffect(() => {
    if (formData.sessionType) {
      const pricing = PRICING[formData.sessionType as keyof typeof PRICING];
      if (pricing?.type === 'group') {
        setEstimatedPrice(pricing.base * formData.numberOfPeople);
      } else if (pricing) {
        setEstimatedPrice(pricing.base);
      }
    }
  }, [formData.sessionType, formData.numberOfPeople]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormErrors> = {};
    if (!formData.sessionType) newErrors.sessionType = 'Please select a session type';
    if (!formData.date) newErrors.date = 'Please select a date';
    if (!formData.time) newErrors.time = 'Please select a time';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    const isGroup = PRICING[formData.sessionType as keyof typeof PRICING]?.type === 'group';
    if (isGroup && formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Please enter number of people';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmation(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNewBooking = () => {
    setShowConfirmation(false);
    setFormData({
      sessionType: '',
      numberOfPeople: 1,
      date: '',
      time: '',
      name: '',
      email: '',
      phone: '',
      notes: ''
    });
    setEstimatedPrice(0);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isGroupSession = formData.sessionType && PRICING[formData.sessionType as keyof typeof PRICING]?.type === 'group';

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] py-16 px-4">
        {/* COLORS: Change bg-[#F5F1ED] to your background color */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif text-[#3D3D3D] mb-2">Booking Submitted!</h1>
              {/* COLORS: Change text-[#3D3D3D] to your heading color */}
              <p className="text-gray-600">Thank you for your booking request. We&apos;ll be in touch soon!</p>
            </div>

            <div className="border-t border-gray-200 pt-8 space-y-4">
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">Booking Summary</h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-600">Session Type:</div>
                <div className="font-medium text-[#3D3D3D]">{formData.sessionType}</div>
                
                {isGroupSession && (
                  <>
                    <div className="text-gray-600">Number of People:</div>
                    <div className="font-medium text-[#3D3D3D]">{formData.numberOfPeople}</div>
                  </>
                )}
                
                <div className="text-gray-600">Date:</div>
                <div className="font-medium text-[#3D3D3D]">
                  {new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                
                <div className="text-gray-600">Time:</div>
                <div className="font-medium text-[#3D3D3D]">
                  {timeSlots.find(slot => slot.value === formData.time)?.label}
                </div>
                
                <div className="text-gray-600">Name:</div>
                <div className="font-medium text-[#3D3D3D]">{formData.name}</div>
                
                <div className="text-gray-600">Email:</div>
                <div className="font-medium text-[#3D3D3D]">{formData.email}</div>
                
                <div className="text-gray-600">Phone:</div>
                <div className="font-medium text-[#3D3D3D]">{formData.phone}</div>
              </div>

              {formData.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-gray-600 text-sm mb-2">Additional Notes:</div>
                  <div className="text-[#3D3D3D]">{formData.notes}</div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-600">Estimated Total:</span>
                  <span className="text-2xl font-bold text-[#3D3D3D]">${estimatedPrice}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">*Does not include travel fees or additional services</p>
              </div>
            </div>

            <button
              onClick={handleNewBooking}
              className="w-full mt-8 bg-[#3D3D3D] text-white py-3 rounded-lg hover:bg-[#2D2D2D] transition-colors duration-200"
            >
              {/* COLORS: Change bg-[#3D3D3D] and hover:bg-[#2D2D2D] to your button colors */}
              Make Another Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] py-16 px-4">
      {/* COLORS: Change bg-[#F5F1ED] to your background color */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-[#3D3D3D] mb-4">Book Your Session</h1>
          {/* COLORS: Change text-[#3D3D3D] to your heading color */}
          <p className="text-gray-600 text-lg">Let&apos;s capture something beautiful together</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Session Type */}
          <div className="mb-8">
            <label className="block text-[#3D3D3D] font-medium mb-3 text-lg">
              Session Type *
            </label>
            <select
              name="sessionType"
              value={formData.sessionType}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                errors.sessionType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {/* COLORS: Change focus:ring-[#3D3D3D] to your accent color */}
              <option value="">Select a session type...</option>
              <optgroup label="Individual Headshots">
                <option value="Headshot (Basic)">Headshot (Basic) - 3 photos - $65</option>
                <option value="Headshot (Standard)">Headshot (Standard) - 5 photos - $100</option>
                <option value="Headshot (Pro)">Headshot (Pro) - 10 photos - $175</option>
              </optgroup>
              <optgroup label="Group Headshots">
                <option value="Grp. Headshot (2-4)">Group Headshot (2-4 people) - 3 photos pp - $55 pp</option>
                <option value="Grp. Headshot (5-9)">Group Headshot (5-9 people) - 3 photos pp - $45 pp</option>
                <option value="Grp. Headshot (10+)">Group Headshot (10+ people) - 3 photos pp - $40 pp</option>
              </optgroup>
              <optgroup label="Individual Modeling">
                <option value="Modeling (Basic)">Modeling (Basic) - 6 photos - $85</option>
                <option value="Modeling (Standard)">Modeling (Standard) - 10-12 photos - $130</option>
                <option value="Modeling (Pro)">Modeling (Pro) - 15-18 photos - $200</option>
              </optgroup>
              <optgroup label="Group Modeling">
                <option value="Grp. Modeling (2-4)">Group Modeling (2-4 people) - 6 photos pp - $70 pp</option>
                <option value="Grp. Modeling (5-9)">Group Modeling (5-9 people) - 6 photos pp - $60 pp</option>
                <option value="Grp. Modeling (10+)">Group Modeling (10+ people) - 6 photos pp - $55 pp</option>
              </optgroup>
            </select>
            {errors.sessionType && (
              <p className="text-red-500 text-sm mt-1">{errors.sessionType}</p>
            )}
          </div>

          {/* Number of People (only for group sessions) */}
          {isGroupSession && (
            <div className="mb-8 animate-fadeIn">
              <label className="block text-[#3D3D3D] font-medium mb-3 text-lg">
                Number of People *
              </label>
              <input
                type="number"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                  errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.numberOfPeople && (
                <p className="text-red-500 text-sm mt-1">{errors.numberOfPeople}</p>
              )}
            </div>
          )}

          {/* Date and Time Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Date */}
            <div>
              <label className="block text-[#3D3D3D] font-medium mb-3 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={getMinDate()}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-[#3D3D3D] font-medium mb-3 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Start Time *
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a time...</option>
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
              {errors.time && (
                <p className="text-red-500 text-sm mt-1">{errors.time}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Session duration: 1.5 hours</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[#3D3D3D] mb-4">Contact Information</h3>
            
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-[#3D3D3D] font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#3D3D3D] font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#3D3D3D] font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-8">
            <label className="block text-[#3D3D3D] font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Any special requests or details we should know about..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D3D3D] transition-all resize-none"
            />
          </div>

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#3D3D3D]" />
                  <span className="text-[#3D3D3D] font-medium text-lg">Estimated Total:</span>
                </div>
                <span className="text-3xl font-bold text-[#3D3D3D]">${estimatedPrice}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">*Does not include travel fees or additional services</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-[#3D3D3D] text-white py-4 rounded-lg text-lg font-medium hover:bg-[#2D2D2D] transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {/* COLORS: Change bg-[#3D3D3D] and hover:bg-[#2D2D2D] to your button colors */}
            Submit Booking Request
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            You&apos;ll receive a confirmation email within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;