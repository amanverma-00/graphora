import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * This is the standard pattern used by shadcn/ui
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`

  return past.toLocaleDateString()
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Get difficulty color classes
 */
export function getDifficultyColor(
  difficulty: 'easy' | 'medium' | 'hard' | string,
): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'text-green-600 dark:text-green-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'hard':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

/**
 * Get difficulty background color classes
 */
export function getDifficultyBgColor(
  difficulty: 'easy' | 'medium' | 'hard' | string,
): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

/**
 * Get status color classes for submission verdicts
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '')

  if (normalizedStatus === 'accepted' || normalizedStatus === 'ac') {
    return 'text-green-600 dark:text-green-400'
  }
  if (normalizedStatus.includes('wrong') || normalizedStatus === 'wa') {
    return 'text-red-600 dark:text-red-400'
  }
  if (normalizedStatus.includes('time') || normalizedStatus === 'tle') {
    return 'text-yellow-600 dark:text-yellow-400'
  }
  if (normalizedStatus.includes('memory') || normalizedStatus === 'mle') {
    return 'text-orange-600 dark:text-orange-400'
  }
  if (normalizedStatus.includes('runtime') || normalizedStatus === 're') {
    return 'text-purple-600 dark:text-purple-400'
  }
  if (normalizedStatus.includes('compile') || normalizedStatus === 'ce') {
    return 'text-blue-600 dark:text-blue-400'
  }
  return 'text-gray-600 dark:text-gray-400'
}

/**
 * Programming language configurations
 */
export const LANGUAGES = [
  {
    value: 'javascript',
    label: 'JavaScript',
    monacoLang: 'javascript',
    icon: '🟨',
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    monacoLang: 'typescript',
    icon: '🔷',
  },
  { value: 'python', label: 'Python 3', monacoLang: 'python', icon: '🐍' },
  { value: 'java', label: 'Java', monacoLang: 'java', icon: '☕' },
  { value: 'cpp', label: 'C++', monacoLang: 'cpp', icon: '⚡' },
  { value: 'c', label: 'C', monacoLang: 'c', icon: '🔧' },
  { value: 'go', label: 'Go', monacoLang: 'go', icon: '🔵' },
  { value: 'rust', label: 'Rust', monacoLang: 'rust', icon: '🦀' },
] as const

export type LanguageValue = (typeof LANGUAGES)[number]['value']

/**
 * Default starter code templates for each language
 */
export const STARTER_CODE: Record<string, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function solution(nums) {
    // Write your code here
    
}`,
  typescript: `function solution(nums: number[]): number {
    // Write your code here
    
}`,
  python: `class Solution:
    def solve(self, nums: List[int]) -> int:
        # Write your code here
        pass`,
  java: `class Solution {
    public int solve(int[] nums) {
        // Write your code here
        
    }
}`,
  cpp: `class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your code here
        
    }
};`,
  c: `int solve(int* nums, int numsSize) {
    // Write your code here
    
}`,
  go: `func solve(nums []int) int {
    // Write your code here
    
}`,
  rust: `impl Solution {
    pub fn solve(nums: Vec<i32>) -> i32 {
        // Write your code here
        
    }
}`,
}
