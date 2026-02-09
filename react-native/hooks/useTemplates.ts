import { useState, useCallback, useEffect } from 'react';
import { useJadeClient } from '@gr33n-ai/jade-sdk-rn-client';
import {
  demoTemplates,
  templateFromSkill,
  type TemplatePresentation,
} from '../types/TemplatePresentation';

export function useTemplates() {
  const client = useJadeClient();
  const [templates, setTemplates] = useState<TemplatePresentation[]>(demoTemplates);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [personalRes, orgRes] = await Promise.allSettled([
        client.listSkills(),
        client.hasOrgContext ? client.listOrgSkills() : Promise.resolve({ skills: [] }),
      ]);

      const personal =
        personalRes.status === 'fulfilled'
          ? personalRes.value.skills.map((s) => templateFromSkill(s, 'personal'))
          : [];
      const org =
        orgRes.status === 'fulfilled'
          ? orgRes.value.skills.map((s) => templateFromSkill(s, 'org'))
          : [];

      // Merge: demo templates first, then personal, then org — dedup by skillName
      const seen = new Set<string>();
      const merged: TemplatePresentation[] = [];

      for (const t of [...demoTemplates, ...personal, ...org]) {
        if (!seen.has(t.skillName)) {
          seen.add(t.skillName);
          merged.push(t);
        }
      }

      setTemplates(merged);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { templates, isLoading, refresh };
}
