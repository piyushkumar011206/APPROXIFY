import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Upload, 
  Info,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';

const schema = z.object({
  eventName: z.string().min(3, 'Event name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  duration: z.number().min(0.1, 'Duration must be a positive number'),
  budget: z.number().min(0, 'Budget must be positive'),
  activityType: z.string().min(1, 'Activity type is required'),
});

type FormData = z.infer<typeof schema>;

const RequestForm: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      budget: 0,
      duration: 1,
      activityType: 'Competition'
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!profile) return;
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'requests'), {
        ...data,
        studentId: profile.uid,
        studentName: profile.displayName,
        department: profile.department || 'Computer Science', // Use student's department
        status: 'pending_faculty',
        createdAt: serverTimestamp(),
        documents: [], // In a real app, we'd upload to Storage first
      });

      // Trigger Notification
      await notificationService.notify(
        profile.uid,
        'Request Submitted',
        `Your request for "${data.eventName}" has been submitted and is pending faculty review.`,
        'new_request',
        docRef.id
      );

      setStep(3); // Success step
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <nav className="mb-12 flex items-center justify-between relative" aria-label="Progress">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" aria-hidden="true"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative z-10 flex flex-col items-center">
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step >= i ? "bg-brown-600 text-white" : "bg-white text-slate-400 border-2 border-slate-200"
              )}
              aria-current={step === i ? "step" : undefined}
            >
              {step > i ? <CheckCircle className="w-6 h-6" aria-hidden="true" /> : i}
            </div>
            <span className={cn(
              "text-xs mt-2 font-medium",
              step >= i ? "text-brown-600" : "text-slate-400"
            )}>
              {i === 1 ? 'Details' : i === 2 ? 'Budget' : 'Complete'}
            </span>
          </div>
        ))}
      </nav>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">Event Details</h3>
                  <p className="text-slate-500 text-sm">Tell us about the activity you want to participate in.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
                    <input 
                      id="eventName"
                      {...register('eventName')}
                      aria-invalid={!!errors.eventName}
                      aria-describedby={errors.eventName ? "eventName-error" : undefined}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                      placeholder="e.g. National Robotics Challenge"
                    />
                    {errors.eventName && <p id="eventName-error" className="text-red-500 text-xs mt-1" role="alert">{errors.eventName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="activityType" className="block text-sm font-medium text-slate-700 mb-1">Activity Type</label>
                    <select 
                      id="activityType"
                      {...register('activityType')}
                      aria-invalid={!!errors.activityType}
                      aria-describedby={errors.activityType ? "activityType-error" : undefined}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                    >
                      <option value="Competition">Competition</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Conference">Conference</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Sports">Sports</option>
                    </select>
                    {errors.activityType && <p id="activityType-error" className="text-red-500 text-xs mt-1" role="alert">{errors.activityType.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      id="description"
                      {...register('description')}
                      aria-invalid={!!errors.description}
                      aria-describedby={errors.description ? "description-error" : undefined}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                      placeholder="Describe the event and why you want to attend..."
                    />
                    {errors.description && <p id="description-error" className="text-red-500 text-xs mt-1" role="alert">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Event Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                        <input 
                          id="date"
                          type="date"
                          {...register('date')}
                          aria-invalid={!!errors.date}
                          aria-describedby={errors.date ? "date-error" : undefined}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                        />
                      </div>
                      {errors.date && <p id="date-error" className="text-red-500 text-xs mt-1" role="alert">{errors.date.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                        <input 
                          id="duration"
                          type="number"
                          step="0.5"
                          {...register('duration', { valueAsNumber: true })}
                          aria-invalid={!!errors.duration}
                          aria-describedby={errors.duration ? "duration-error" : undefined}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                          placeholder="1"
                        />
                      </div>
                      {errors.duration && <p id="duration-error" className="text-red-500 text-xs mt-1" role="alert">{errors.duration.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-brown-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-200"
                  >
                    Next Step <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">Budget & Documents</h3>
                  <p className="text-slate-500 text-sm">Provide financial details and supporting documents.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-slate-700 mb-1">Estimated Budget ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                      <input 
                        id="budget"
                        type="number"
                        {...register('budget', { valueAsNumber: true })}
                        aria-invalid={!!errors.budget}
                        aria-describedby={errors.budget ? "budget-error" : undefined}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.budget && <p id="budget-error" className="text-red-500 text-xs mt-1" role="alert">{errors.budget.message}</p>}
                  </div>

                  <div 
                    className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-brown-400 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-brown-500 outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label="Upload Event Brochure or Invitation"
                  >
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3 group-hover:text-brown-500" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-700">Upload Event Brochure / Invitation</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                  </div>

                  <div className="bg-brown-50 p-4 rounded-xl flex items-start gap-3" role="note">
                    <Info className="w-5 h-5 text-brown-600 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-brown-700 leading-relaxed">
                      Your request will be routed to your Faculty Advisor first, and then to the HOD for final approval.
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex justify-between">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 text-slate-600 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-brown-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-200 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Request Submitted!</h3>
                  <p className="text-slate-500">Your activity request has been sent for approval. You can track its status on your dashboard.</p>
                </div>
                <div className="pt-6">
                  <button 
                    type="button"
                    onClick={() => navigate('/')}
                    className="bg-brown-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-200"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';

export default RequestForm;
