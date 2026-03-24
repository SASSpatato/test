/**
 * 💡 SkeletonScreen関連コンポーネントのテスト
 *
 * テスト対象:
 * - Skeleton (基本コンポーネントのクラス適用)
 * - DashboardSkeleton (正常レンダリング)
 * - ViewerSkeleton (正常レンダリング)
 * - CardSkeleton (正常レンダリング)
 * - ListSkeleton (Propsに応じたリスト数の動的生成)
 */

import React from 'react';
import { render } from '@testing-library/react';
// 注: Skeletonは文字やボタンを持たないため、screenやfireEventは今回は使用しません
import { 
  Skeleton, 
  DashboardSkeleton, 
  ViewerSkeleton, 
  CardSkeleton, 
  ListSkeleton 
} from '../SkeletonScreen'; // ※実際の相対パスに合わせて調整してください

describe('SkeletonScreen', () => {
  
  // beforeEachでのモッククリアは、今回はモック(jest.fn)が存在しないため省略しています

  describe('Skeleton (基本コンポーネント)', () => {
    it('should render with default Tailwind classes', () => {
      const { container } = render(<Skeleton />);
      
      // レンダリングされた一番外側の要素を取得
      const element = container.firstChild as HTMLElement;
      
      // 要素がドキュメント内に存在することを確認
      expect(element).toBeInTheDocument();
      // デフォルトのTailwindクラスが正しく当たっているか検証
      expect(element).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('should merge custom className correctly', () => {
      // カスタムクラスを渡してレンダリング
      const { container } = render(<Skeleton className="h-20 w-full custom-class" />);
      const element = container.firstChild as HTMLElement;
      
      // デフォルトクラスとカスタムクラスがマージされていることを確認
      expect(element).toHaveClass('animate-pulse', 'h-20', 'w-full', 'custom-class');
    });
  });

  describe('DashboardSkeleton表示', () => {
    it('should render DashboardSkeleton without crashing', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // エラーにならず、DOMが生成されていることのみを確認
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ViewerSkeleton表示', () => {
    it('should render ViewerSkeleton without crashing', () => {
      const { container } = render(<ViewerSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('CardSkeleton表示', () => {
    it('should render CardSkeleton without crashing', () => {
      const { container } = render(<CardSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ListSkeleton機能', () => {
    it('should render 5 skeleton items by default when no props provided', () => {
      const { container } = render(<ListSkeleton />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      
      // 初期状態（Propsなし）の場合、子要素（リストアイテム）が5つ生成されることを確認
      expect(wrapper.childNodes.length).toBe(5);
    });

    it('should render specified number of skeleton items when count prop is provided', () => {
      // countプロパティに3を指定してレンダリング
      const { container } = render(<ListSkeleton count={3} />);
      
      const wrapper = container.firstChild as HTMLElement;
      
      // 指定した数（3つ）のリストアイテムが生成されていることを確認
      expect(wrapper.childNodes.length).toBe(3);
    });
  });

});