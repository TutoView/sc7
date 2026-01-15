
import { GoogleGenAI } from "@google/genai";
import { Task, Member } from "../types.ts";

const AI_KEY_STORAGE = 'cg-flow-ai-key';

export const getWorkloadAdvice = async (tasks: Task[], members: Member[]) => {
  const apiKey = localStorage.getItem(AI_KEY_STORAGE);

  if (!apiKey || apiKey.length < 10) {
    console.warn("AI 분석을 위한 API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const taskContext = tasks.map(t => ({
      title: t.title,
      assigned: members.find(m => m.id === t.assignedTo)?.name || '미배정',
      status: t.status === 'BACKLOG' ? '대기' : t.status === 'IN_PROGRESS' ? '진행중' : '완료',
      priority: t.priority,
      category: t.category,
      delayCount: t.delayCount,
      elapsedDays: t.startedAt ? Math.floor((Date.now() - t.startedAt) / 86400000) : 0,
      deadline: new Date(t.deadline).toLocaleDateString()
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 방송국 CG팀 전략 매니저입니다. 
      상황 데이터: ${JSON.stringify(taskContext)}.
      
      주요 문제점:
      1. 긴급 작업(EMERGENCY)이 들어오면 기존 작업이 계속 밀림.
      2. 단순 작업(SIMPLE)임에도 불구하고 시간을 끄는 비효율성 발생.
      
      해결책을 팀장님께 단호하고 전문적으로 3줄 내외로 조언하세요. 
      누가 시간을 끌고 있는지, 어떤 업무가 '방치'되고 있는지 콕 집어주세요. 한국어로 답변해주세요.`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "API 키가 올바르지 않거나 호출 한도를 초과했습니다. [관리 설정]에서 키를 확인하세요.";
  }
};

export const saveAiKey = (key: string) => {
  localStorage.setItem(AI_KEY_STORAGE, key);
};

export const getAiKey = () => {
  return localStorage.getItem(AI_KEY_STORAGE) || '';
};
