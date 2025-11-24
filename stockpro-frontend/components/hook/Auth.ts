import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  selectCurrentToken,
  selectCurrentUser,
  setCredentials,
} from "../store/slices/auth/auth";

export const IsAuth = () => {
  const Token = useAppSelector(selectCurrentToken);
  const User = useAppSelector(selectCurrentUser);

  return Token && User ? true : false;
};
export const NavigationHandler = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const URLtoken = queryParams.get("token");
    const URLuserParam = queryParams.get("user");

    try {
      const token = decodeURIComponent(URLtoken || "");
      const userParam = decodeURIComponent(URLuserParam || "");

      const user = userParam ? JSON.parse(userParam) : {};
      if (token) {
        dispatch(setCredentials({ accessToken: token, user }));
        enqueueSnackbar("Login successful!", { variant: "success" });
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      enqueueSnackbar("Login failed!", { variant: "error" });
    }
  }, [dispatch, navigate]);

  return null;
};
export const useAuth = () => {
  const Token = useAppSelector(selectCurrentToken);
  const User = useAppSelector(selectCurrentUser);

  return { Token, User, isAuthed: Token && User ? true : false };
};
