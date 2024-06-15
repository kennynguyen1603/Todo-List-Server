import { Router } from "express";
import authMiddleware from "../middlewares/auth/auth.js";
import teamsController from "../controllers/teamsController.js";
const TeamRouter = Router();

// chỉ có admin mới có thể xem tất cả các team
TeamRouter.get(
  "",
  authMiddleware.verifyToken,
  authMiddleware.verifyAdmin,
  teamsController.getAllTeams
);

// tạo team mới
TeamRouter.post("", authMiddleware.verifyToken, teamsController.createTeam);

// lấy tất cả các team mà user đã tạo
TeamRouter.get(
  "/created",
  authMiddleware.verifyToken,
  teamsController.getTeamsCreatedByUserId
);

TeamRouter.get(
  "/:teamId",
  authMiddleware.verifyToken,
  teamsController.getTeamById
);

TeamRouter.put(
  "/:teamId",
  authMiddleware.verifyToken,
  teamsController.updateTeamById
);
// không cần xác thực chủ vì xóa todo đã xác thực rồi nên không cần xác thực chủ
TeamRouter.delete(
  "/:teamId",
  authMiddleware.verifyToken,
  teamsController.deleteTeamById
);

// lấy tất cả các thành viên trong team dựa vào teamId
TeamRouter.get(
  "/:teamId/members",
  authMiddleware.verifyToken,
  teamsController.getMembersByTeamId
);

TeamRouter.get(
  "/:teamId/todos",
  authMiddleware.verifyToken,
  teamsController.getTeamsHasParticipatedByUserId
);

TeamRouter.delete(
  "/:teamId/remove-from-users",
  authMiddleware.verifyToken,
  teamsController.removeTeamFromUsers
);

// TeamRouter.get(
//   "/:teamId/members",
//   authMiddleware.verifyToken,
//   teamsController.getMembersByTeamId
// );

// TeamRouter.post(
//   "/:teamId/members",
//   authMiddleware.verifyToken,
//   teamsController.addMemberToTeam
// );

// TeamRouter.delete(
//   "/:teamId/members/:memberId",
//   authMiddleware.verifyToken,
//   teamsController.removeMemberFromTeam
// );

export default TeamRouter;
