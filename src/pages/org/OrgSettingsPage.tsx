import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PawPrint, Trash2, Plus, X } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgActions, getOrgById } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import OrgProfileForm, { type OrgFormFields } from '@/components/org/OrgProfileForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organization, Dog } from '@/types';

export default function OrgSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgs, isOrgAdmin } = useOrg();
  const { dogs: userDogs } = useDog();

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgDogs, setOrgDogs] = useState<Dog[]>([]);
  const [saving, setSaving] = useState(false);

  const id = orgId ?? '';
  const { updateOrg, addDogToOrg, removeDogFromOrg, deleteOrg } = useOrgActions(id);

  useEffect(() => {
    if (!id) return;
    const found = orgs.find(o => o.id === id);
    if (found) {
      setOrg(found);
      setOrgLoading(false);
    } else {
      getOrgById(id).then(o => { setOrg(o); setOrgLoading(false); });
    }
  }, [id, orgs]);

  useEffect(() => {
    if (!id) return;
    getDocs(query(collection(db, 'dogs'), where('orgId', '==', id))).then(snap => {
      setOrgDogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog)));
    });
  }, [id]);

  const amAdmin = isOrgAdmin(id);

  if (orgLoading) return <div className="text-muted-foreground p-8">Loading…</div>;
  if (!org || !amAdmin) return <div className="text-muted-foreground p-8">Not authorized.</div>;

  const handleSave = async (fields: OrgFormFields) => {
    setSaving(true);
    await updateOrg({
      name: fields.name,
      type: fields.type || undefined,
      description: fields.description || undefined,
      email: fields.email || undefined,
      phone: fields.phone || undefined,
      website: fields.website || undefined,
      instagram: fields.instagram || undefined,
      facebook: fields.facebook || undefined,
      address: (fields.street || fields.city || fields.state || fields.zip || fields.country)
        ? {
            street:  fields.street  || undefined,
            city:    fields.city    || undefined,
            state:   fields.state   || undefined,
            zip:     fields.zip     || undefined,
            country: fields.country || undefined,
          }
        : undefined,
    });
    setSaving(false);
  };

  const handleDeleteOrg = async () => {
    if (!window.confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
    await deleteOrg();
    navigate('/orgs');
  };

  const handleAddDog = async (dogId: string) => {
    await addDogToOrg(dogId);
    const dog = userDogs.find(d => d.id === dogId);
    if (dog) setOrgDogs(prev => [...prev, dog]);
  };

  const handleRemoveDog = async (dogId: string) => {
    await removeDogFromOrg(dogId);
    setOrgDogs(prev => prev.filter(d => d.id !== dogId));
  };

  const unlinkedDogs = userDogs.filter(
    d => d.mainHumanId === user?.uid && !orgDogs.some(od => od.id === d.id)
  );

  const initial: OrgFormFields = {
    name:        org.name          ?? '',
    type:        org.type          ?? '',
    description: org.description   ?? '',
    email:       org.email         ?? '',
    phone:       org.phone         ?? '',
    website:     org.website       ?? '',
    instagram:   org.instagram     ?? '',
    facebook:    org.facebook      ?? '',
    street:      org.address?.street  ?? '',
    city:        org.address?.city    ?? '',
    state:       org.address?.state   ?? '',
    zip:         org.address?.zip     ?? '',
    country:     org.address?.country ?? '',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Org Settings — {org.name}</h1>

      <Card>
        <CardHeader><CardTitle>Organization Profile</CardTitle></CardHeader>
        <CardContent>
          <OrgProfileForm initial={initial} loading={saving} submitLabel="Save Changes" onSubmit={handleSave} />
        </CardContent>
      </Card>

      {/* Dogs management */}
      <Card>
        <CardHeader><CardTitle>Dogs in this Organization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {orgDogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dogs linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {orgDogs.map(dog => (
                <li key={dog.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                  {dog.photoURL ? (
                    <img src={dog.photoURL} alt={dog.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {dog.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium capitalize">{dog.name}</span>
                  <button
                    onClick={() => handleRemoveDog(dog.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove from org"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {unlinkedDogs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Add one of your dogs:</p>
              <div className="space-y-2">
                {unlinkedDogs.map(dog => (
                  <div key={dog.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    <PawPrint className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm capitalize">{dog.name}</span>
                    <Button size="sm" variant="outline" onClick={() => handleAddDog(dog.id)} className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Organization</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will permanently remove the organization and all its member data.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteOrg} className="gap-1.5 shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
