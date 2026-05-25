"use client";

import { useState, useEffect } from "react";

export interface BenchmarkAgent {
  agent: string;
  passRate: string;
  passRatePercent: number;
  costPerRun: string;
}

export interface BenchmarkEvidence {
  skill: string;
  date: string;
  verify: { layer1: string; layer2: string };
  agents: BenchmarkAgent[];
}

export interface Skill {
  id: string;
  name: string;
  title: string;
  description: string;
  type: string;
  version: string;
  platform: string;
  command: string;
  scope: string;
  pack: string | null;
  path: string;
  tags: string[];
  benchmarkEvidence: BenchmarkEvidence | null;
}

interface SkillsData {
  generatedAt: string;
  skillCount: number;
  packCount: number;
  skills: Skill[];
}

declare global {
  interface Window {
    SKILLS_SHOWCASE_DATA?: SkillsData;
  }
}

export function useSkillsData() {
  const [data, setData] = useState<SkillsData | null>(null);

  useEffect(() => {
    const check = () => {
      if (window.SKILLS_SHOWCASE_DATA) {
        setData(window.SKILLS_SHOWCASE_DATA);
        return true;
      }
      return false;
    };
    if (!check()) {
      const interval = setInterval(() => {
        if (check()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  return data;
}

export function getPackSkills(skills: Skill[], packName: string): Skill[] {
  return skills.filter((s) => s.pack === packName);
}

export function getGlobalSkills(skills: Skill[]): Skill[] {
  return skills.filter((s) => s.pack === null);
}
