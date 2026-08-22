'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ThreatCategory } from '@/lib/types';
import { Plus } from 'lucide-react';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (data: {
    attackerIp: string;
    primaryCategory: ThreatCategory;
    confidence: number;
    ttlHours: number;
    notes?: string;
  }) => Promise<void>;
}

export function AddBlockModal({ isOpen, onClose, onAddBlock }: AddBlockModalProps) {
  const [ip, setIp] = useState('');
  const [category, setCategory] = useState<ThreatCategory>('brute_force');
  const [confidence, setConfidence] = useState('0.95');
  const [ttlHours, setTtlHours] = useState('48');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) {
      setError('Please enter a valid IPv4 or IPv6 address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAddBlock({
        attackerIp: ip.trim(),
        primaryCategory: category,
        confidence: parseFloat(confidence),
        ttlHours: parseInt(ttlHours, 10),
        notes: notes.trim() || 'Manual emergency block added via admin dashboard',
      });
      setIp('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add block instruction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Manual Threat Block"
      description="Broadcast an immediate preemptive block instruction to all connected member nodes."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#ffffff]">
            Attacker IP Address
          </label>
          <Input
            placeholder="e.g. 198.51.100.42"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#ffffff]">
              Threat Category
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ThreatCategory)}
            >
              <option value="brute_force">Brute Force / Auth Stuffing</option>
              <option value="honeypot_probe">Honeypot Scanner</option>
              <option value="sqli_xss">SQL Injection / XSS</option>
              <option value="rate_abuse">L7 Rate Abuse / Burst</option>
              <option value="scanner">Reconnaissance Bot</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#ffffff]">
              Confidence Score
            </label>
            <Select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="font-mono"
            >
              <option value="0.99">0.99 (Definitive Signature)</option>
              <option value="0.95">0.95 (High Confidence)</option>
              <option value="0.90">0.90 (Corroborated)</option>
              <option value="0.80">0.80 (Standard)</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#ffffff]">
            Block TTL Duration (Self-Healing Expiry)
          </label>
          <Select
            value={ttlHours}
            onChange={(e) => setTtlHours(e.target.value)}
            className="font-mono"
          >
            <option value="24">24 Hours</option>
            <option value="48">48 Hours (Recommended)</option>
            <option value="72">72 Hours</option>
            <option value="168">7 Days</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#ffffff]">
            Internal Justification / Notes (Optional)
          </label>
          <Input
            placeholder="e.g. Targeted login flood observed on auth endpoints"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-2">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={loading}
            icon={<Plus className="w-4 h-4 text-[#000000]" />}
          >
            Deploy Network Block
          </Button>
        </div>
      </form>
    </Modal>
  );
}
