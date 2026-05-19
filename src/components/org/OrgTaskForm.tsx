import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { OrgTaskType, OrgMember, OrgEnrolledDog } from '@/types';

const TASK_TYPES: { value: OrgTaskType; label: string }[] = [
  { value: 'grooming',        label: 'Grooming' },
  { value: 'bath',            label: 'Bath' },
  { value: 'nail_trim',       label: 'Nail Trim' },
  { value: 'dental',          label: 'Dental Care' },
  { value: 'ear_clean',       label: 'Ear Cleaning' },
  { value: 'training',        label: 'Training Session' },
  { value: 'walk',            label: 'Walk' },
  { value: 'feeding',         label: 'Feeding' },
  { value: 'medication',      label: 'Medication' },
  { value: 'vet_visit',       label: 'Vet Visit' },
  { value: 'behavior_check',  label: 'Behavior Check' },
  { value: 'socialization',   label: 'Socialization' },
  { value: 'other',           label: 'Other' },
];

interface Props {
  enrolledDogs: OrgEnrolledDog[];
  members: OrgMember[];
  onSubmit: (data: {
    dogId: string; dogName: string; title: string; type: OrgTaskType;
    assignedTo: string; assignedToName: string; dueAt?: number; notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  defaultDogId?: string;
}

export default function OrgTaskForm({ enrolledDogs, members, onSubmit, onCancel, defaultDogId }: Props) {
  const [dogId, setDogId] = useState(defaultDogId ?? '');
  const [type, setType] = useState<OrgTaskType>('grooming');
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedDog = enrolledDogs.find(d => d.dogId === dogId);
  const assignee = members.find(m => m.userId === assignedTo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dogId || !assignedTo || !title.trim()) return;
    setSaving(true);
    let dueAt: number | undefined;
    if (dueDate) {
      const d = new Date(`${dueDate}T${dueTime || '09:00'}`);
      dueAt = d.getTime();
    }
    await onSubmit({
      dogId,
      dogName: selectedDog?.dogName ?? '',
      title: title.trim(),
      type,
      assignedTo,
      assignedToName: assignee?.displayName ?? '',
      dueAt,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Dog *</Label>
          <Select value={dogId} onValueChange={setDogId} required>
            <SelectTrigger><SelectValue placeholder="Select dog…" /></SelectTrigger>
            <SelectContent>
              {enrolledDogs.filter(d => d.status === 'active').map(d => (
                <SelectItem key={d.dogId} value={d.dogId}>{d.dogName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Task Type *</Label>
          <Select value={type} onValueChange={v => setType(v as OrgTaskType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-title">Task Description *</Label>
        <Input
          id="task-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Full groom — deshedding treatment"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Assign To *</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo} required>
          <SelectTrigger><SelectValue placeholder="Select staff member…" /></SelectTrigger>
          <SelectContent>
            {members.map(m => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.displayName}{m.staffRole ? ` · ${m.staffRole}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="due-date">Due Date</Label>
          <Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due-time">Due Time</Label>
          <Input id="due-time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-notes">Notes</Label>
        <textarea
          id="task-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Special instructions…"
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !dogId || !assignedTo || !title.trim()} className="flex-1">
          {saving ? 'Creating…' : 'Create Task'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
