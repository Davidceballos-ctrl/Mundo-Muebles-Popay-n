const ROLE_PERMS = {
  Administrador: new Set(["*"]),
  Vendedor:      new Set(["pos","ventas","clientes","productos.ver","garantias","cotizaciones"]),
  Bodeguero:     new Set(["compras","proveedores","productos.ver","productos.editar","kardex","garantias"]),
};

export function can(user, perm) {
  if (!user) return false;
  const perms = ROLE_PERMS[user.rol];
  if (!perms) return false;
  if (perms.has("*")) return true;
  return perms.has(perm);
}

export function usePermissions(user) {
  return {
    can:         (perm) => can(user, perm),
    isAdmin:     user?.rol === "Administrador",
    isVendedor:  user?.rol === "Vendedor",
    isBodeguero: user?.rol === "Bodeguero",
    rol:         user?.rol || "",
  };
}
