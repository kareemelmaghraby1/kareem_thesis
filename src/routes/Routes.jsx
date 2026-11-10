import React from "react";
import { Route, Switch } from "react-router-dom";

import Home from "../pages/Home";
import Catalog from "../pages/Catalog";
import Detail from "../pages/detail/Detail";
import Login from "../pages/account/Login";
import Account from "../pages/account/Account";

import * as Config from "../constants/Config";

const Routes = () => {
  return (
    <Switch>
      <Route path={`/${Config.HOME_PAGE}/login`} exact component={Login} />
      <Route path={`/${Config.HOME_PAGE}/account`} exact component={Account} />
      <Route
        path={`/${Config.HOME_PAGE}/:category/search/:keyword`}
        component={Catalog}
      />
      <Route path={`/${Config.HOME_PAGE}/:category/:id`} component={Detail} />
      <Route path={`/${Config.HOME_PAGE}/:category`} component={Catalog} />
      <Route path={`/${Config.HOME_PAGE}`} exact component={Home} />
    </Switch>
  );
};

export default Routes;
