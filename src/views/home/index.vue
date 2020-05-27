<!--
    文件：src/views/home/index.vue
    作者：Pi
    时间：2019/07/22
    描述：首页
-->

<template>
  <section class="home-page">
    <el-row>
      <el-col>
        <el-tabs type="border-card">
          <el-tab-pane label="账号">
            <el-form ref="form" label-width="80px" size="mini">
              <el-form-item label="用户名">
                <el-select v-model="user" placeholder="请选择帐号">
                  <el-option
                    v-for="user in userList"
                    :key="user.value"
                    :value="user"
                    :label="user.userID"
                  ></el-option>
                </el-select>
                <el-button @click="login" v-text="'登录'" style="margin-left:10px"></el-button>
                <el-button @click="logout" v-text="'登 出'"></el-button>
              </el-form-item>
              <el-form-item label="课堂号">
                <el-input
                  id="roomid"
                  v-model.trim="roomID"
                  placeholder="课堂ID"
                  style="width:180px;margin-right:10px"
                ></el-input>
                <el-button @click="createClassroom" v-text="'创建房间'"></el-button>
                <el-button @click="joinClassroom" v-text="'进入房间'"></el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
    <!-- <router-link to="/test">内嵌路由</router-link> -->
    <div class="main">
      <div class="messModel">
        <div class="sendMessage">
          <el-input
            v-model.trim="message"
            placeholder="内容"
            style="width:320px;margin-right:30px;margin-bottom:20px;"
          ></el-input>
          <el-button @click="sendMessage" v-text="'发送'"></el-button>
        </div>
        <div class="message">
          <ul>
            <li :class="item.from==user.userID?'self':''" v-for="(item,key) in msgItem" :key="key">
              <div class="name">{{item.from}}</div>
              <div class="mes">{{item.para}}</div>
            </li>
          </ul>
        </div>
      </div>
      <div class="board">
        <el-main>
          <div id="paint_box" style="background-color: rgb(240, 240, 240);"></div>
        </el-main>
      </div>
      <div class="tools">
        <ul class="tool">
          <li
            v-for="(tool, key) in tools.children"
            :key="key"
            @click="onSetTool($event,tools.type,tool.val)"
            :class="{'atv': toolsAtv === tool.val}"
          >
            <img :src="tool.icon" :alt="tool.title" :title="tool.title" />
          </li>
        </ul>
      </div>
    </div>
    <router-view></router-view>
  </section>
</template>

<script>
import { mapGetters } from "vuex";
import AccountConf from "@config/account.js";

export default {
  data() {
    return {
      user: {
        userID: "y001",
        userSig:
          "eJwtzFELgjAUhuH-stvCzo6bptCdI6hAIr0IupG24iDVUBuN6L8n08vv*eD9supwipzpWM4wArYMm7R5DnSjwB6Az97rtrGWNMu5AIhTSCROj-lY6szoUkoEgEkHegRbZ5kQXKZzhe5jlhflgitUQ1*jN22Hu709*74sXu*rApdWW*0wvqyS5lhv2O8PuWIwMw__"
      },
      isLogin: false,
      groupInfo: {
        isCreateGroup: false
      },
      sdkReady: false, //SDK状态
      // SDK待执行队列
      sdkReadyQueue: [],
      tim: null, //实例
      message: "", //要发送的消息
      msgItem: [], //消息列表
      roomID: "", //房间号
      //当前用户状态
      STATUS_UNINIT: 0,
      STATUS_UNLOGIN: 1,
      STATUS_LOGINED: 2,
      STATUS_INCLASS: 3,
      status: 0,
      imSubQueue: [],
      tools: {
        type: "TOOL_TYPE",
        children: [
          {
            title: "鼠标",
            val: "TEDU_BOARD_TOOL_TYPE_MOUSE",
            icon: require("@imgs/board/mouse.png")
          },
          {
            title: "画笔",
            val: "TEDU_BOARD_TOOL_TYPE_PEN",
            icon: require("@imgs/board/icon_brush.png")
          },
          {
            title: "文字输入",
            val: "TEDU_BOARD_TOOL_TYPE_TEXT",
            icon: require("@imgs/board/icon_text.png")
          },
          {
            title: "橡皮擦",
            val: "TEDU_BOARD_TOOL_TYPE_ERASER",
            icon: require("@imgs/board/icon_eraser.png")
          },
          {
            title: "激光笔",
            val: "TEDU_BOARD_TOOL_TYPE_LASER",
            icon: require("@imgs/board/icon_highlighter.png")
          },
          {
            title: "圆形",
            val: "TEDU_BOARD_TOOL_TYPE_OVAL",
            icon: require("@imgs/board/icon_oval.png")
          },
          {
            title: "矩形",
            val: "TEDU_BOARD_TOOL_TYPE_RECT",
            icon: require("@imgs/board/icon_rectangle.png")
          },
          {
            title: "重做",
            val: "REDO",
            icon: require("@imgs/board/icon_down.png")
          },
          {
            title: "撤销",
            val: "UNDO",
            icon: require("@imgs/board/icon_up.png")
          }
        ]
      },
      toolsAtv: "TEDU_BOARD_TOOL_TYPE_MOUSE",
      toolsShow: "TEDU_BOARD_TOOL_TYPE_MOUSE"
    };
  },
  computed: {
    ...mapGetters({
      name: "User/getName",
      desc: "User/getDesc"
    }),
    userList() {
      return AccountConf.users;
    }
  },
  mounted() {
    window.vm = this;
    this.inIntTim();
  },
  methods: {
    inIntTim() {
      //创建实例
      this.tim = window.TIM.create({ SDKAppID: AccountConf.sdkappid });
      this.tim.on(window.TIM.EVENT.SDK_READY, this.onSdkReady);
      this.tim.on(window.TIM.EVENT.SDK_NOT_READY, this.onSdkNotReady);
      this.tim.on(window.TIM.EVENT.MESSAGE_RECEIVED, this.onTIMListener);
    },
    login() {
      this.tim
        .login(this.user)
        .then(res => {
          if (res.data.actionStatus === "OK") {
            alert("恭喜你，登录成功");
            this.status = this.STATUS_LOGINED;
          }
        })
        .catch(function(imError) {
          this.status = this.STATUS_UNLOGIN;
          alert("登录失败的相关信息:", imError); // 登录失败的相关信息
        });
    },
    logout() {},
    //创建房间
    createClassroom() {
      this.tim
        .createGroup({
          type: window.TIM.TYPES.GRP_PUBLIC,
          name: "测试房" || "WebSDK",
          groupID: this.roomID,
          // memberList: [{ userID: "user1" }, { userID: "user2" }] // 如果填写了 memberList，则必须填写 userID
          joinOption: window.TIM.TYPES.JOIN_OPTIONS_FREE_ACCESS
        })
        .then(res => {
          console.log(res);
          this.groupInfo = {
            isCreateGroup: true,
            groupID: this.roomID
          };
        })
        .catch(err => {
          window.console.warn("createGroup error:", err); // 创建群组失败的相关信息
        });
    },
    // 加入房间
    joinClassroom() {
      this.tim
        .joinGroup({
          groupID: this.roomID,
          type: window.TIM.TYPES.GRP_AVCHATROOM
        })
        .then(res => {
          console.log(this.roomID);
          console.log(window.TIM.TYPES.GRP_AVCHATROOM);
          console.log(res);
          switch (res.data.status) {
            case window.TIM.TYPES.JOIN_STATUS_SUCCESS:
            case window.TIM.TYPES.JOIN_STATUS_ALREADY_IN_GROUP:
              alert("加入房间成功");
              // 初始化白板
              this.initBoard();
              this.status = this.STATUS_INCLASS;
              break;
            case window.TIM.TYPES.JOIN_STATUS_WAIT_APPROVAL:
            default:
              this.$message("失败", res);
          }
        })
        .catch(t => {
          console.log(t);
          if (t.code === 10013 || t.code === -12) {
            this.status = this.STATUS_INCLASS;
            // 初始化白板
            this.initBoard();
            alert("加入房间");
          } else {
            alert("当前课堂号不存在", "温馨提示");
          }
        });
    },
    // TIM SDK 初始化成功
    onSdkReady(ev) {
      window.console.log("IM:SDK is Already", ev);
      this.status = this.STATUS_UNLOGIN;
      this.doFuncSdkQueue();
    },
    // TIM SDK 初始化失败回调函数
    onSdkNotReady(ev) {
      window.console.log("IM:SDK is Notready", ev);
      this.sdkReady = this.STATUS_UNINIT;
    },
    // TIM 回调信息监听
    onTIMListener(ev) {
      ev.data.forEach(v => {
        // 只接受来自群组的信息
        if (window.TIM.TYPES.CONV_GROUP === v.conversationType) {
          if (!v.payload.text) {
            return false;
          }

          let resBody = JSON.parse(v.payload.text || "");
          console.log(resBody);
          // console.log('IM信息传输===>', resBody)
          this.onMsgPublish({
            from: v.from,
            to: v.to,
            // cmd: resBody.cmd,
            para: resBody
          });
          this.showMessageInBox({
            from: v.from,
            to: v.to,
            // cmd: resBody.cmd,
            para: resBody
          });
        }
      });
      window.console.log("IM回调信息", ev);
    },
    // TIM SDK 待执行队列
    checkSdkReady(callback) {
      this.sdkReadyQueue.push(callback);
      this.doFuncSdkQueue();
    },

    // TIM SDK 栈执行
    doFuncSdkQueue() {
      if (this.sdkReady) {
        while (this.sdkReadyQueue.length) {
          this.sdkReadyQueue.shift()();
        }
      }
    },
    // 添加消息队列
    addSubQueue(cb) {
      let isSub = this.imSubQueue.some(v => cb === v);
      if (!isSub) {
        this.imSubQueue.push(cb);
      }
    },
    // 收到IM信息 -> 推送出去
    onMsgPublish(resBody) {
      // this.imMsgQueue.push(resBody)
      this.imSubQueue.forEach(func => {
        func(resBody);
      });
    },
    // 解散所有群组
    dismissAllGroup() {
      let disCount = 0;
      let quitCount = 0;
      this.tim.getGroupList().then(res => {
        if (res.data.groupList) {
          res.data.groupList.forEach(group => {
            if (group.selfInfo.role === "Owner") {
              // 解散该用户所有群组
              this.tim
                .dismissGroup(group.groupID)
                .then(response => {
                  disCount++;
                  console.log(disCount, "群组解散成功:", response.data.groupID);
                })
                .catch(err => {
                  console.log("群组解散失败:", err);
                });
            } else {
              // 退出该用户加入的群组
              this.tim.quitGroup(group.groupID).then(resQuit => {
                quitCount++;
                console.log(quitCount, "退出群组成功", resQuit.data.groupID);
              });
            }
          });
        }
      });
    },
    //发送消息
    sendMessage() {
      if (!this.message) {
        return false;
      }
      let msgBody = this.tim.createTextMessage({
        to: this.roomID,
        conversationType: window.TIM.TYPES.CONV_GROUP,
        payload: { text: JSON.stringify(this.message) }
      });
      this.tim
        .sendMessage(msgBody)
        .then(res => {
          this.$message("发送消息成功", res);
          console.log(this.user.userID);

          let mess = {
            from: this.user.userID,
            para: this.message,
            to: this.roomID
          };
          this.showMessageInBox(mess);
          this.message = "";
        })
        .catch(err => {
          this.$message("发送消息失败", err);
        });
    },
    showMessageInBox(body) {
      this.msgItem.push(body);
    },
    // 初始化白板
    initBoard() {
      let initParams = {
        id: "paint_box", // dom节点id
        classId: this.roomID, // 整数
        sdkAppId: AccountConf.sdkappid, // 整数
        userId: this.user.userID, // 字符串
        userSig: this.user.userSig, // 字符串
        ratio: "1:1",
        smoothLevel: 0,
        boardContentFitMode: 1,
        toolType: 1,
        setDataSyncEnable: true
      };
      this.teduBoard = new window.TEduBoard(initParams);
      this.initBoardEvent();
    },
    initBoardEvent() {
      var teduBoard = this.teduBoard;
      var EVENT = window.TEduBoard.EVENT;
      var vm = this;
      // 新增白板
      teduBoard.on(EVENT.TEB_ADDBOARD, (boardIds, fid) => {
        console.log("TEB_ADDBOARD", " boardIds:", boardIds, " fid:", fid);
        vm.proBoardData();
      });

      // 白板同步数据回调(收到该回调时需要将回调数据通过信令通道发送给房间内其他人，接受者收到后调用AddSyncData接口将数据添加到白板以实现数据同步)
      teduBoard.on(EVENT.TEB_SYNCDATA, data => {
        console.log("======================:  ", "TEB_SYNCDATA");
      });

      // 收到白板初始化完成事件后，表示白板已处于正常工作状态（此时白板为空白白板，历史数据尚未拉取完成）
      teduBoard.on(EVENT.TEB_INIT, () => {
        // 控制器丢给上层
        // vm.$emit("initBoard", vm);
        console.log("======================:  ", "TEB_INIT");
      });

      // 历史数据回调用
      teduBoard.on(EVENT.TEB_HISTROYDATA_SYNCCOMPLETED, res => {
        console.log("历史白板数据===>>>>", res);
        setTimeout(() => {
          vm.onSetBackgroundImage(
            "https://eclass.lucfish.com/static/img/grid.jpg"
          );
        }, 10);
        // 初始化演示ppt
        // vm.initPPTCase();
        // vm.isInit = true;
        // 通知上层可以操作
        // vm.$emit("boardCanHandle", true);
      });

      // 白板错误回调
      teduBoard.on(EVENT.TEB_ERROR, (code, msg) => {
        console.error("TEB_ERROR", " code:", code, " msg:", msg);
      });

      // 白板警告回调
      teduBoard.on(EVENT.TEB_WARNING, (code, msg) => {
        console.error("TEB_WARNING", " code:", code, " msg:", msg);
      });

      // 删除白板页回调
      teduBoard.on(EVENT.TEB_DELETEBOARD, (boardIds, fid) => {
        console.log("TEB_DELETEBOARD", " boardIds:", boardIds, " fid:", fid);
        vm.proBoardData();
      });

      // 跳转白板页回调
      teduBoard.on(EVENT.TEB_GOTOBOARD, (boardId, fid) => {
        console.log("TEB_GOTOBOARD", " boardId:", boardId, " fid:", fid);
        // vm.$store.dispatch("Board/setCurrBoardFid", fid + "|" + boardId);
        // vm.onSetBackgroundImage('https://eclass.lucfish.com/static/img/grid.jpg')
        vm.proBoardData();
      });

      // ppt动画步数改变回调
      teduBoard.on(EVENT.TEB_GOTOSTEP, (step, count) => {
        console.log("TEB_GOTOSTEP", " step:", step, " count:", count);
        // this.$parent.publishTeaConf({ step });
      });

      // 增加H5动画PPT文件回调
      teduBoard.on(EVENT.TEB_ADDH5PPTFILE, fid => {
        console.log("TEB_ADDH5PPTFILE", " fid:", fid);
        this.proBoardData();
      });

      // 增加文件回调
      teduBoard.on(EVENT.TEB_ADDFILE, fid => {
        console.log("TEB_ADDFILE", " fid:", fid);
        this.proBoardData();
      });

      // 增加转码文件回调
      teduBoard.on(EVENT.TEB_ADDTRANSCODEFILE, fid => {
        console.log("TEB_ADDTRANSCODEFILE", " fid:", fid);
        this.proBoardData();
      });
      // 增加Images文件回调
      teduBoard.on(EVENT.TEB_ADDIMAGESFILE, fid => {
        console.log("TEB_ADDIMAGESFILE", " fid:", fid);
        this.proBoardData();
      });
    },
    /**
     * 白板事件回调处理
     * @param {*} data
     */
    proBoardData(data) {
      console.log(data);
      // this.fileInfoList = this.teduBoard.getFileInfoList();
      // this.currentFileId = this.teduBoard.getCurrentFile();
      // this.thumbUrls = this.teduBoard.getThumbnailImages(this.currentFileId);
      // var fileInfo = this.teduBoard.getFileInfo(this.currentFileId);
      // if (fileInfo) {
      //   this.boardData = {
      //     currentBoardId: this.currentFileId,
      //     boardIdlist: this.teduBoard.getFileBoardList(this.currentFileId),
      //     current: fileInfo.currentPageIndex + 1,
      //     total: fileInfo.pageCount
      //   }
      // }
    },
    //设置背景图片
    onSetBackgroundImage(backgroundImage) {
      var path = backgroundImage;
      return this.teduBoard.setBackgroundImage(path);
    },
    onSetTool(ev, type, tool) {
      ev.stopPropagation();
      if (
        tool === "TEDU_BOARD_TOOL_TYPE_PEN" ||
        tool === "TEDU_BOARD_TOOL_TYPE_TEXT"
      ) {
        // this.onAllHide(false)
      } else {
        // this.onAllHide(true)
      }
      switch (tool) {
        case "UNDO":
          this.$emit("onUnDo");
          break;
        case "REDO":
          this.$emit("onReDo");
          break;
        default:
          this.toolsAtv = tool;
          console.log(window.TEduBoard[type][tool]);
          console.log(this.teduBoard);
          this.teduBoard.setToolType(window.TEduBoard[type][tool]);

        // this.toolsShow = tool
        // this.$store.dispatch('Board/setToolType', window.TEduBoard[type][tool])
      }
    }
  }
};
</script>


<style lang="less" scoped>
.message {
  height: 400px;
  width: 400px;
  font-size: 14px;
  background-color: #fff;
  color: #00a4ff;
  ul {
    li {
      display: flex;
      align-items: center;
      .mes {
        margin-left: 10px;
      }
      &.self {
        flex-direction: row-reverse;
        .mes {
          margin-right: 10px;
        }
      }
    }
  }
}
.main {
  display: flex;
  align-items: center;
}
#paint_box {
  width: 500px;
  height: 500px;
  border: 1px solid #888;
  overflow: hidden;
  box-sizing: content-box;
  position: relative;
}
.tool {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0px -2px 20px 0px rgba(0, 0, 0, 0.3);
  > li {
    cursor: pointer;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
    height: 40px;
    margin: 10px 0;
    &:hover {
      opacity: 0.8;
    }
  }
  .atv {
    opacity: 1;
  }
}
</style>