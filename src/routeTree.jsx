import { createRootRoute, createRoute } from "@tanstack/react-router";
import Layout from "./components/Layout";
import HomePage from "./routes/home";
import CreatePage from "./routes/create";
import UsersPage from "./routes/users";
import TosPage from "./routes/tos";
import PastePage from "./routes/paste";
import AdminPage from "./routes/admin";
import UserProfilePage from "./routes/user-profile";

const rootRoute = createRootRoute({
  component: Layout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersPage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$username",
  component: UserProfilePage,
});

const createRoutePage = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreatePage,
});

const tosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tos",
  component: TosPage,
});

const pasteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/paste/$pasteId",
  component: PastePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  createRoutePage,
  usersRoute,
  userProfileRoute,
  tosRoute,
  pasteRoute,
  adminRoute,
]);
