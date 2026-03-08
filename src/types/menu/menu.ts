//src/types/menu/menu.ts

/** 动态菜单树节点 (对应 MenuTreeVO) */
export interface MenuTreeVO {
  /** 菜单ID */
  id: number;
  /** 父菜单ID */
  menuParentId: number;
  /** 菜单名称 */
  menuName: string;
  /** 路由路径 */
  menuPath: string;
  /** 组件路径 */
  menuComponent?: string;
  /** 组件路径 */
  menuRedirect?: string;
  /** 菜单图标 */
  menuIcon?: string;
  /** 菜单类型: 0目录, 1菜单, 2按钮 */
  menuType: number;
  /** 显示状态: 0显示, 1隐藏 */
  menuVisible: number;
  /** 子菜单列表 */
  children?: MenuTreeVO[];
  /** 路由元信息 */
  meta: MetaVO;
}

/** 路由元信息 (对应 MetaVO) */
export interface MetaVO {
  /** 菜单标题 */
  title: string;
  /** 菜单图标 */
  icon?: string;
  /** 是否缓存页面 */
  keepAlive?: boolean;
  /** 是否隐藏菜单 */
  hidden?: boolean;
  /** 外链地址 */
  link?: string;
  /** 是否固定在标签栏 */
  affix?: boolean;
  /** * 🌟 核心修复：添加字符串索引签名
   * 解决 "Index signature for type string is missing" 报错
   */
  [key: string | symbol]: unknown;
}
