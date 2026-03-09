//src/types/menu/menu.ts

/** * 动态菜单树节点 (MenuTreeVO)
 * 用于渲染树形表格和前端动态路由表，继承自 SysMenuVO
 */
export interface MenuTreeVO extends SysMenuVO {
  /** 子菜单列表 (用于构建树形结构) */
  children?: MenuTreeVO[];
  /** 路由元信息 */
  meta?: MetaVO;
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

/** 新增菜单请求参数 (MenuAddReqDTO) */
export interface MenuAddReqDTO {
  /** 父菜单ID (顶级目录传0) - 必填项 */
  menuParentId: number;
  /** 菜单名称 - 必填项 */
  menuName: string;
  /** 菜单编码 (唯一标识) - 必填项 */
  menuCode: string;
  /** 菜单类型 (1:目录, 2:菜单, 3:按钮) - 必填项 */
  menuType: number;
  /** 显示顺序 (数值越小越靠前) - 必填项 */
  menuSort: number;
  /** 前端路由地址 */
  menuPath?: string;
  /** 前端组件路径 */
  menuComponent?: string;
  /** 重定向地址 */
  menuRedirect?: string;
  /** 菜单图标 */
  menuIcon?: string;
  /** 后端权限标识 */
  menuPermission?: string;
  /** 菜单是否可见 (1:可见 0:隐藏) */
  menuVisible?: number;
  /** 菜单业务状态 (1:正常 0:停用) */
  menuStatus?: number;
}

/** 修改菜单请求参数 (MenuEditReqDTO) */
export interface MenuEditReqDTO extends MenuAddReqDTO {
  /** 菜单ID - 必填项 */
  id: number | string;
}
/** * 菜单信息展示对象 (SysMenuVO)
 * 对应后端基础的菜单视图对象
 */
export interface SysMenuVO {
  /** 菜单ID */
  id: number;
  /** 父菜单ID (顶级菜单为0) */
  menuParentId: number;
  /** 菜单名称 (如: 系统管理) */
  menuName: string;
  /** 菜单编码 (唯一标识, 如: sys_manage) */
  menuCode: string;
  /** 路由路径 (如: /system) */
  menuPath: string;
  /** 前端组件路径 (如: system/user/index) */
  menuComponent?: string;
  /** 菜单图标 (如: setting) */
  menuIcon?: string;
  /** 菜单类型 (1:目录, 2:菜单, 3:按钮) */
  menuType: number;
  /** 权限标识 (如: sys:user:list) */
  menuPermission?: string;
  /** 排序值 (数值越小越靠前) */
  menuSort: number;
  /** 重定向地址 */
  menuRedirect: string;
  /** 是否显示 (1:显示, 0:隐藏) */
  menuVisible: number;
  /** 是否启用 (1:启用, 0:停用) */
  menuStatus: number;
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 修改者 */
  updateBy?: string;
  /** 修改时间 */
  updateTime?: string;
}
