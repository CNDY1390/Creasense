/**
 * 移动端文字选择控制工具
 * 提供额外的JavaScript控制来防止意外文字选择
 */

export class TextSelectionManager {
  private static instance: TextSelectionManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): TextSelectionManager {
    if (!TextSelectionManager.instance) {
      TextSelectionManager.instance = new TextSelectionManager();
    }
    return TextSelectionManager.instance;
  }

  /**
   * 初始化文字选择控制
   */
  init(): void {
    if (this.isInitialized) {
      console.log('[TextSelection] 已经初始化');
      return;
    }

    console.log('[TextSelection] 初始化文字选择控制');

    // 禁用右键菜单
    this.disableContextMenu();

    // 禁用选择开始事件
    this.disableSelectStart();

    // 禁用拖拽选择
    this.disableDragSelect();

    this.isInitialized = true;
    console.log('[TextSelection] 文字选择控制初始化完成');
  }

  /**
   * 禁用右键菜单
   */
  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;

      // 检查是否应该禁用右键菜单
      if (this.shouldDisableSelection(target)) {
        e.preventDefault();
        console.log('[TextSelection] 禁用右键菜单', target.tagName, target.className);
      }
    });
  }

  /**
   * 禁用选择开始事件
   */
  private disableSelectStart(): void {
    document.addEventListener('selectstart', (e) => {
      const target = e.target as HTMLElement;

      // 检查是否应该禁用选择
      if (this.shouldDisableSelection(target)) {
        e.preventDefault();
        console.log('[TextSelection] 禁用文字选择', target.tagName, target.className);
      }
    });
  }

  /**
   * 禁用拖拽选择
   */
  private disableDragSelect(): void {
    document.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;

      // 检查是否应该禁用拖拽
      if (this.shouldDisableSelection(target)) {
        e.preventDefault();
        console.log('[TextSelection] 禁用拖拽选择', target.tagName, target.className);
      }
    });
  }

  /**
   * 判断是否应该禁用选择
   */
  private shouldDisableSelection(element: HTMLElement): boolean {
    // 检查元素本身
    if (this.hasNoSelectClass(element)) {
      return true;
    }

    // 检查父元素
    let parent = element.parentElement;
    while (parent) {
      if (this.hasNoSelectClass(parent)) {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  /**
   * 检查元素是否有禁用选择的类
   */
  private hasNoSelectClass(element: HTMLElement): boolean {
    const noSelectClasses = [
      'no-select',
      'page-title',
      'fa-solid',
      'fa-regular',
      'fa-brands',
      'icon',
      'decorative-text',
      'status-indicator',
      'status-text',
      'status-level',
      'metric-value',
      'percentage',
      'risk-percentage',
      'device-model',
      'device-status',
      'btn-primary',
      'btn-secondary',
      'btn-danger',
      'metric-label',
      'greeting',
      'user-name',
      'view-all'
    ];

    return noSelectClasses.some(className =>
      element.classList.contains(className)
    );
  }

  /**
   * 为特定元素添加禁用选择功能
   */
  addNoSelectToElement(element: HTMLElement): void {
    if (!element.classList.contains('no-select')) {
      element.classList.add('no-select');
      // console.log('[TextSelection] 为元素添加禁用选择', element.tagName, element.className);
    }
  }

  /**
   * 为特定元素添加可访问性文字功能
   */
  addAccessibleTextToElement(element: HTMLElement): void {
    if (!element.classList.contains('accessible-text')) {
      element.classList.add('accessible-text');
      // console.log('[TextSelection] 为元素添加可访问性文字', element.tagName, element.className);
    }
  }

  /**
   * 为特定元素添加隐私文字功能
   */
  addPrivacyTextToElement(element: HTMLElement): void {
    if (!element.classList.contains('privacy-text')) {
      element.classList.add('privacy-text');
      // console.log('[TextSelection] 为元素添加隐私文字保护', element.tagName, element.className);
    }
  }

  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log('[TextSelection] 清理文字选择控制');
    this.isInitialized = false;
  }
}

// 导出单例实例
export const textSelectionManager = TextSelectionManager.getInstance();
